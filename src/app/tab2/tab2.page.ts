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
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import { SpinnerService } from '../services/spinner.service';


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


  constructor(private filestackService: FilestackService, private alertCtrl: AlertController, private spinner: SpinnerService) {
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

      materia.archivos.push({ url: fileUrl, nombre: nombreArchivo.trim() || 'Archivo sin nombre', extension: this.getFileExtension(fileUrl), subidoPor: user.uid, fechaSubida: new Date() })
      this.guardarMaterias();
    } catch (error) {
      console.error('Error subiendo archivo:', error);
    }
  }

  async eliminarArchivo(materia: Materia, archivo: { url: string, nombre: string }) {

    await this.spinner.run(async () => {
      if (!this.user) return;
      materia.archivos = materia.archivos?.filter(a => a.url !== archivo.url);

      // Actualizar en Firestore
      const docRef = doc(db, 'usuarios', this.user.uid, 'materias', materia.nombre);
      await setDoc(docRef, materia);

      console.log('Archivo eliminado en Firestore');
    }, 'Eliminando archivo...');
  }

  async agregarMateria() {
    if (!this.user) return;

    const materiasRef = collection(db, "usuarios", this.user.uid, "materias");
    const nuevaRef = doc(materiasRef); // genera ID único

    const nuevaMateria = {
      id: nuevaRef.id, // mismo ID local y Firestore
      nombre: 'Nueva Materia',
      descripcion: '',
      imagen: 'assets/default.png',
      titulos: [],
      expandida: false,
      favorito: false,
      publica: false,
      archivos: []
    };

    await this.spinner.run(async () => {
      try {
        await setDoc(nuevaRef, nuevaMateria); // crea el documento con ID correcto
      } catch (err) {
        console.error('Error al crear materia:', err);
      }
    }, 'Creando materia');

    this.materias.push(nuevaMateria);
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
  }

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
      console.log('Intentando eliminar materia con ID:', materia.id);
      await deleteDoc(doc(db, 'usuarios', this.user.uid, 'materias', materia.id));

      // Actualizar el arreglo local para reflejar la UI
      this.materias = this.materias.filter(m => m.id !== materia.id);

      console.log(`Materia "${materia.nombre}" eliminada correctamente`);
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

  async guardarMaterias() {
    const user = getAuth().currentUser;
    if (!user) return;

    const materiasRef = collection(db, 'usuarios', user.uid, 'materias');

    for (const materia of this.materias) {
      if (!materia.id) continue; // ignorar materias sin id
      const docRef = doc(materiasRef, materia.id);
      await setDoc(docRef, { ...materia, publica: materia.publica }, { merge: true });
    }

    console.log('Materias guardadas correctamente.');
  }


  initPublicaStr() {
    this.materias.forEach(m => m.publicaStr = m.publica ? 'true' : 'false');
  }

  async onCambioPublica(materia: any, event: any) {
    // Convertimos string a boolean
    materia.publica = event.detail.value === 'true';
    materia.publicaStr = event.detail.value;

    try {
      await this.guardarMaterias();
      console.log(`Materia ${materia.nombre} actualizada → pública: ${materia.publica}`);
    } catch (error) {
      console.error('Error guardando cambio de estado público:', error);
    }
  }

  async cargarMaterias() {
    const user = getAuth().currentUser;
    if (!user) return;

    await this.spinner.run(async () => {
      try {
        const materiasRef = collection(db, 'usuarios', user.uid, 'materias');
        const snapshot = await getDocs(materiasRef);
        this.materias = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Materia));
      } catch (error) {
        console.error('Error al cargar materias:', error);
      }
    }, 'Cargando materias...');
  }

}

