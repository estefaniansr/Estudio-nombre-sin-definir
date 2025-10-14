import { Component, OnInit } from '@angular/core';
import { AlertController, IonicModule, ActionSheetController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { collection, getDocs, collectionGroup, where, query } from 'firebase/firestore';
import { db, auth } from '../../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { SpinnerService } from '../services/spinner.service';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-comunidad',
  templateUrl: './comunidad.page.html',
  styleUrls: ['./comunidad.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class ComunidadPage implements OnInit {
  materias: Materia[] = [];
  currentUserEmail: string | null = null;
  creadores: string[] = [];
  materiasOriginal: Materia[] = [];

  constructor(private spinner: SpinnerService, private alertCtrl: AlertController, private actionSheetCtrl: ActionSheetController) { }

  async ngOnInit() {
    // Esperar al usuario actual
    this.currentUserEmail = await new Promise<string | null>(resolve => {
      onAuthStateChanged(auth, user => resolve(user?.email || null));
    });


    await this.spinner.run(async () => {
      await this.cargarMaterias();
    }, 'Cargando materias de la comunidad...');
  }


  async cargarMaterias() {
    try {
      this.materias = [];

      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));

      // Traer las materias de todos los usuarios en paralelo
      const promesas = usuariosSnapshot.docs.map(async userDoc => {
        const materiasRef = collection(db, 'usuarios', userDoc.id, 'materias');
        const materiasSnapshot = await getDocs(materiasRef);

        return materiasSnapshot.docs
          .map(m => {
            const data = m.data() as Materia;
            return { id: m.id, ...data, publica: !!data.publica, ownerEmail: userDoc.data()['email'] }; // fuerza booleano
          })
          .filter(materia => materia.publica); // solo públicas
      });

      const todasMaterias = await Promise.all(promesas);
      this.materias = todasMaterias.flat();

      console.log('Materias de todos los usuarios cargadas:', this.materias);

      this.materiasOriginal = [...this.materias];

      this.creadores = Array.from(
        new Set(
          this.materias
            .map(m => m.ownerEmail)
            .filter((email): email is string => !!email)
        )
      );


    } catch (error) {
      console.error('Error cargando materias de la comunidad:', error);
    }
  }
  async abrirFiltro() {
    const buttons: any[] = [
      {
        text: 'Por nombre ( A - Z )',
        handler: () => {
          this.materias.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
          this.materias = [...this.materias];
        },
      },
      {
        text: 'Filtrar por creador',
        handler: async () => {
          // Abrimos un alert con radios (ya lo tenías funcionando)
          const alert = await this.alertCtrl.create({
            header: 'Seleccionar creador',
            inputs: this.creadores.map(c => ({
              label: c,
              type: 'radio',
              value: c,
            })),
            buttons: [
              { text: 'Cancelar', role: 'cancel' },
              {
                text: 'Aceptar',
                handler: (creadorSeleccionado: string) => {
                  if (creadorSeleccionado) {
                    this.materias = this.materiasOriginal.filter(m => m.ownerEmail === creadorSeleccionado);
                  }
                }
              }
            ]
          });
          await alert.present();
        }
      },
      {
        text: 'Mostrar todas',
        role: 'cancel',
        handler: () => {
          this.materias = [...this.materiasOriginal];
        }
      }
    ];

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Filtrar materias',
      buttons
    });
    await actionSheet.present();
  }


  esPropia(materia: Materia): boolean {
    if (!materia.archivos) return false;
    return materia.archivos.some(a => a.subidoPor === this.currentUserEmail);
  }

  getFileExtension(url: string): string {
    try {
      // 1. Intentar obtener la extensión del nombre real del archivo si la URL lo contiene
      const urlObj = new URL(url);
      const pathname = urlObj.pathname; // ejemplo: /files/abc123/documento.pdf
      const parts = pathname.split('.');
      if (parts.length > 1) {
        return parts.pop()!.toLowerCase();
      }

      // 2. Si no tiene extensión, intentar deducirla por tipo MIME
      const mimeTypes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'application/zip': 'zip',
      };

      return 'bin'; // valor por defecto si no se puede detectar
    } catch {
      return 'bin';
    }
  }

  async descargarMateria(materia: Materia) {
    if (!materia.archivos || materia.archivos.length === 0) {
      const alert = await this.alertCtrl.create({
        header: 'Sin archivos',
        message: 'Esta materia no tiene archivos para descargar.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder(materia.nombre);



    try {
      for (const archivo of materia.archivos) {
        const response = await fetch(archivo.url);
        const blob = await response.blob();

        // Aseguramos que tenga extensión válida
        const extension = archivo.extension || this.getFileExtension(archivo.url);
        const nombreConExtension = archivo.nombre.endsWith(`.${extension}`)
          ? archivo.nombre
          : `${archivo.nombre}.${extension}`;

        folder?.file(nombreConExtension, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      FileSaver.saveAs(content, `${materia.nombre}.zip`);
    } catch (error) {
      console.error('Error descargando materia:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo descargar la materia.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }


}
