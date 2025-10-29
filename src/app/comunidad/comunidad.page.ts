import { Component, OnInit } from '@angular/core';
import { AlertController, IonicModule, ActionSheetController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { collection, getDocs, collectionGroup, where, query, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
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
  girando = false;

  constructor(private spinner: SpinnerService, private alertCtrl: AlertController, private actionSheetCtrl: ActionSheetController) { }


  /**
 * @function ngOnInit
 * @description Se ejecuta al iniciar el componente. Espera al usuario autenticado y carga las materias de la comunidad.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando las materias se cargan completamente.
 */
  async ngOnInit() {
    this.currentUserEmail = await new Promise<string | null>(resolve => {
      onAuthStateChanged(auth, user => resolve(user?.email || null));
    });


    await this.spinner.run(async () => {
      await this.cargarMaterias();
    }, 'Cargando materias de la comunidad...');
  }

  /**
 * @function recargarMaterias
 * @description Vuelve a cargar las materias de la comunidad desde la base de datos.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando la recarga finaliza.
 */
  async recargarMaterias() {
    await this.spinner.run(async () => {
      await this.cargarMaterias();
    }, 'Cargando materias...');

  }

  /**
* @function cargarMaterias
* @description Obtiene todas las materias públicas de todos los usuarios desde Firestore.
* @return { Promise<void> } Retorna una promesa que se resuelve cuando todas las materias se cargaron correctamente.
*/
  async cargarMaterias() {
    try {
      this.materias = [];

      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));

      const promesas = usuariosSnapshot.docs.map(async userDoc => {
      const materiasRef = collection(db, 'usuarios', userDoc.id, 'materias');
      const materiasSnapshot = await getDocs(materiasRef);

      return materiasSnapshot.docs
        .map(m => {
          const data = m.data() as Materia;
          return { ...data, id: m.id, publica: !!data.publica, ownerEmail: userDoc.data()['email'], ownerId: userDoc.id };
        })
        .filter(materia => materia.publica); 
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

  /**
 * @function abrirFiltro
 * @description Abre un menú de opciones para filtrar las materias por nombre o por creador.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando el ActionSheet es presentado.
 */
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

  /**
 * @function esPropia
 * @description Verifica si una materia fue creada por el usuario actual.
 * @param { Materia } materia - Objeto de tipo Materia que se desea verificar.
 * @return { boolean } Retorna true si la materia pertenece al usuario actual, false en caso contrario.
 */
  esPropia(materia: Materia): boolean {
    if (!materia.archivos) return false;
    return materia.archivos.some(a => a.subidoPor === this.currentUserEmail);
  }

  /**
 * @function getFileExtension
 * @description Obtiene la extensión de un archivo a partir de su URL o tipo MIME.
 * @param { string } url - URL del archivo del cual se desea obtener la extensión.
 * @return { string } Retorna la extensión del archivo o 'bin' si no se puede determinar.
 */
  getFileExtension(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname; 
      const parts = pathname.split('.');
      if (parts.length > 1) {
        return parts.pop()!.toLowerCase();
      }

      const mimeTypes: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'application/zip': 'zip',
      };

      return 'bin'; 
    } catch {
      return 'bin';
    }
  }

  /**
 * @function descargarMateria
 * @description Descarga todos los archivos de una materia en formato ZIP.
 * @param { Materia } materia - La materia cuyos archivos se desean descargar.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando la descarga se completa o se muestra un error.
 */
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
