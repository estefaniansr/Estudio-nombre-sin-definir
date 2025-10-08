import { Component } from '@angular/core';
import { IonicModule, IonInput, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { FilestackService } from '../services/filestack.service';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, getFirestore, getDocs, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab2Page {
  materias: Materia[] = [];
  user: any = null;

  constructor(private filestackService: FilestackService, private alertCtrl: AlertController) {
    const auth = getAuth();
    auth.onAuthStateChanged(user => {
      if (user) {
        this.user = user;
        this.cargarMaterias();
      } else {
        console.warn('No hay usuario logueado aún.');
      }
    });
  }

  async mostrarPrompt(header: string, value: string = ''): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        inputs: [{ name: 'input', type: 'text', value }],
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
          { text: 'Aceptar', handler: (data) => resolve(data.input) }
        ]
      });
      await alert.present();
    });
  }

  async pedirPermisoAlmacenamiento(): Promise<boolean> {
    try {
      const result = await Filesystem.requestPermissions();
      // Verificamos si tiene permiso
      if (result.publicStorage === 'granted') {
        return true;
      } else {
        const alert = await this.alertCtrl.create({
          header: 'Permiso denegado',
          message: 'Se necesita permiso de almacenamiento para subir archivos',
          buttons: ['OK']
        });
        await alert.present();
        return false;
      }
    } catch (error) {
      console.error('Error pidiendo permisos:', error);
      return false;
    }
  }


  async subirArchivo(materia: Materia) {

    const permisoOtorgado = await this.pedirPermisoAlmacenamiento();
    if (!permisoOtorgado) return;

    try {
      const result: any = await this.filestackService.openPicker();
      const fileUrl = result.filesUploaded[0].url;

      const nombreArchivo = await this.mostrarPrompt('Nombre del archivo', 'Archivo sin nombre');
      const user = getAuth().currentUser;

      if (!user) {
        alert('Debes iniciar sesión primero.');
        return;
      }

      if (nombreArchivo === null) return;

      if (!materia.archivos) {
        materia.archivos = [];
      }

      if (!materia.archivos) materia.archivos = [];

      materia.archivos.push({ url: fileUrl, nombre: nombreArchivo.trim() || 'Archivo sin nombre', subidoPor: user.uid, fechaSubida: new Date() })
      this.guardarMaterias();
    } catch (error) {
      console.error('Error subiendo archivo:', error);
    }
  }

  async eliminarArchivo(materia: Materia, archivo: { url: string, nombre: string }) {
    if (!this.user) return;
    materia.archivos = materia.archivos?.filter(a => a.url !== archivo.url);

    // Actualizar en Firestore
    const docRef = doc(db, 'usuarios', this.user.uid, 'materias', materia.nombre);
    await setDoc(docRef, materia);

    console.log('Archivo eliminado en Firestore');
  }



  agregarMateria() {
    const nuevaMateria: Materia = {
      id: doc(collection(db, 'usuarios', this.user.uid, 'materias')).id,
      nombre: 'Nueva Materia',
      descripcion: '',
      imagen: 'assets/default.png',
      titulos: [],
      expandida: false,
      favorito: false
    };
    this.materias.push(nuevaMateria);
    this.guardarMaterias();
  }

  toggleExpandir(materia: Materia) {
    materia.expandida = !materia.expandida;
  }

  agregarTitulo(materia: Materia, nuevoTituloInput: IonInput) {
    nuevoTituloInput.getInputElement().then(inputEl => {
      const titulo = inputEl.value?.trim();
      if (titulo) {
        materia.titulos.push(titulo);
        inputEl.value = '';
        this.guardarMaterias();
      }
    });
  }

  editarDescripcion(materia: Materia) {
    materia.editandoDescripcion = true;
    materia.descripcionTemp = materia.descripcion || '';
  }

  guardarDescripcion(materia: Materia) {
    materia.descripcion = materia.descripcionTemp || '';
    materia.editandoDescripcion = false;
    this.guardarMaterias();
  }

  toggleFavorito(materia: Materia) {
    materia.favorito = !materia.favorito;
    this.guardarMaterias();
  }  // agregarlo a la bd

  eliminarTitulo(materia: Materia, index: number) {
    materia.titulos.splice(index, 1);
    this.guardarMaterias();
  }

  async editarMateria(materia: Materia) {
    const alert = await this.alertCtrl.create({
      header: 'Editar nombre de la materia',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          value: materia.nombre,
          placeholder: 'Nuevo nombre'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoNombre = data.nombre?.trim();
            if (nuevoNombre) {
              materia.nombre = nuevoNombre;
              this.guardarMaterias();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarMateria(materia: Materia) {
    if (!this.user) return;

    if (!materia.id) {
      console.error('No se puede eliminar la materia: no tiene ID');
      return;
    }

    try {
      // Borrar documento usando el ID
      await deleteDoc(doc(db, 'usuarios', this.user.uid, 'materias', materia.id));

      // Borrar del arreglo local para actualizar la UI
      this.materias = this.materias.filter(m => m.id !== materia.id);

      console.log('Materia eliminada correctamente');
    } catch (error) {
      console.error('Error eliminando materia:', error);
    }
  }



  async cambiarFotoMateria(materia: Materia) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      materia.imagen = image.dataUrl!;
      this.guardarMaterias();
    } catch (error) {
      console.log('No se seleccionó ninguna foto', error);
    }
  } // corregir

  eliminarFoto(materia: Materia) {
    materia.imagen = 'assets/default.png';
    this.guardarMaterias();
  } // corregir

  async guardarMaterias() {
    const user = getAuth().currentUser;
    if (!user) {
      console.error('Usuario no autenticado');
      return;
    }

    try {
      const materiasRef = collection(db, 'usuarios', user.uid, 'materias');
      for (const materia of this.materias) {
        if (!materia.id) {
          // Generar un ID si no tiene
          materia.id = doc(materiasRef).id;
        }
        await setDoc(doc(materiasRef, materia.id), materia);
      }
      console.log('Materias guardadas en Firestore para el usuario', user.uid);
    } catch (error) {
      console.error('Error al guardar materias en Firestore:', error);
    }
  }

  async cargarMaterias() {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const materiasRef = collection(db, 'usuarios', user.uid, 'materias');
      const snapshot = await getDocs(materiasRef);
      this.materias = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Materia));
    } catch (error) {
      console.error('Error al cargar materias:', error);
    }
  }

}

