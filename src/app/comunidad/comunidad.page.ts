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

}
