import { Component, ElementRef, ViewChild } from '@angular/core';
import { IonicModule, IonInput, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, FilesystemDirectory } from '@capacitor/filesystem';
import { FilestackService } from '../services/filestack.service';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getFirestore, getDocs, getDoc, query, where, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase-config';
import * as JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import { SpinnerService } from '../services/spinner.service';
import { Capacitor } from '@capacitor/core';
import { auth } from '../../firebase-config';



@Component({
  selector: 'app-materia',
  templateUrl: './materias.page.html',
  styleUrls: ['./materias.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MateriaPage {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  materias: Materia[] = [];
  user: any = null;
  todasExpandidas: boolean = false;
  currentUserEmail: string | null = null;


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

  /**
@function ngOnInit
@description Se ejecuta al inicializar el componente y obtiene el correo del usuario autenticado. Actualiza la propiedad currentUserEmail.
*/
  async ngOnInit() {
    onAuthStateChanged(auth, user => {
      this.currentUserEmail = user?.email || null;
    });
  }

  /**
@function mostrarPrompt
@description Muestra un prompt con un campo de texto para ingresar o editar un valor.
@param { string } header Título del prompt.
@param { string } value Valor inicial del campo de entrada.
@return { Promise<string | null> } Retorna el texto ingresado o null si se cancela.
*/
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

  /**
@function pedirPermisoAlmacenamiento
@description Solicita permisos de almacenamiento al usuario y muestra una alerta si son denegados.
@return { Promise<boolean> } Retorna true si los permisos fueron otorgados, false en caso contrario.
*/
  async pedirPermisoAlmacenamiento(): Promise<boolean> {
    try {
      const result = await Filesystem.requestPermissions();
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
  /**
  @function getFileExtension
  @description Obtiene la extensión de archivo desde una URL, o devuelve "bin" si no puede determinarla.
  @param { string } url Dirección del archivo.
  @return { string } Extensión del archivo detectada o "bin".
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
@function subirArchivo
@description Permite al usuario seleccionar y subir un archivo asociado a una materia, guardando la información en Firestore.
@param { Materia } materia Objeto de la materia donde se agregará el archivo.
@return { Promise<void> } Retorna una promesa cuando el archivo ha sido subido y guardado.
*/
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

  /**
@function eliminarArchivo
@description Elimina un archivo de una materia tanto localmente como en Firestore.
@param { Materia } materia Materia que contiene el archivo.
@param { object } archivo Objeto con los datos del archivo a eliminar.
@return { Promise<void> } Retorna una promesa al completar la eliminación.
*/
  async eliminarArchivo(materia: Materia, archivo: { url: string, nombre: string }) {

    await this.spinner.run(async () => {
      if (!this.user) return;
      materia.archivos = materia.archivos?.filter(a => a.url !== archivo.url);

      const docRef = doc(db, 'usuarios', this.user.uid, 'materias', materia.nombre);
      await setDoc(docRef, materia);

      console.log('Archivo eliminado en Firestore');
    }, 'Eliminando archivo...');
  }

  /**
@function agregarMateria
@description Crea una nueva materia en Firestore con valores predeterminados y la agrega a la lista local.
@return { Promise<void> } Retorna una promesa cuando la nueva materia ha sido creada.
*/
  async agregarMateria() {
    if (!this.user) return;

    const materiasRef = collection(db, "usuarios", this.user.uid, "materias");
    const nuevaRef = doc(materiasRef);

    const nuevaMateria = {
      id: nuevaRef.id,
      nombre: 'Nueva Materia',
      descripcion: '',
      imagen: 'assets/default.png',
      titulos: [],
      expandida: false,
      favorito: false,
      publica: false,
      archivos: [],
      likes: 0,
      dislikes: 0,
      likedBy: [],
      dislikedBy: [],
      ownerEmail: this.currentUserEmail!,
      ownerId: auth.currentUser?.uid!
    };

    await this.spinner.run(async () => {
      try {
        await setDoc(nuevaRef, nuevaMateria);
      } catch (err) {
        console.error('Error al crear materia:', err);
      }
    }, 'Creando materia');

    this.materias.push(nuevaMateria);
  }

  /**
@function toggleExpandirTodos
@description Expande o colapsa todas las materias simultáneamente.
*/
  toggleExpandirTodos() {
    this.todasExpandidas = !this.todasExpandidas;
    this.materias.forEach(m => m.expandida = this.todasExpandidas);
  }

  /**
@function toggleExpandir
@description Alterna la expansión individual de una materia para mostrar u ocultar su contenido.
@param { Materia } materia Materia seleccionada.*/

  toggleExpandir(materia: Materia) {
    materia.expandida = !materia.expandida;
  }

  /**
@function agregarTitulo
@description Agrega un nuevo título a la materia a partir del valor ingresado en el campo de texto.
@param { Materia } materia Materia a la que se agregará el título.
@param { IonInput } nuevoTituloInput Campo de entrada donde el usuario escribe el título.
*/
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

  /**
@function editarDescripcion
@description Permite editar la descripción de una materia.
@param { Materia } materia Materia cuya descripción se editará.*/

  editarDescripcion(materia: Materia) {
    materia.editandoDescripcion = true;
    materia.descripcionTemp = materia.descripcion || '';
  }

  /**
@function guardarDescripcion
@description Guarda los cambios realizados en la descripción de la materia y actualiza Firestore.
@param { Materia } materia Materia cuya descripción fue modificada.*/
  guardarDescripcion(materia: Materia) {
    materia.descripcion = materia.descripcionTemp || '';
    materia.editandoDescripcion = false;
    this.guardarMaterias();
  }

  /**
@function toggleFavorito
@description Marca o desmarca una materia como favorita.
@param { Materia } materia Materia que se desea marcar o desmarcar como favorita.*/
  toggleFavorito(materia: Materia) {
    materia.favorito = !materia.favorito;
    this.guardarMaterias();
  }

  /**
@function eliminarTitulo
@description Elimina un título de la lista de títulos de una materia.
@param { Materia } materia Materia de la cual se eliminará el título.
@param { number } index Índice del título a eliminar.*/
  eliminarTitulo(materia: Materia, index: number) {
    materia.titulos.splice(index, 1);
    this.guardarMaterias();
  }

  /**
@function editarMateria
@description Permite editar el nombre de una materia a través de un cuadro de diálogo.
@param { Materia } materia Materia cuyo nombre se va a modificar.
@return { Promise<void> } Retorna una promesa cuando finaliza la edición.
*/
  async editarMateria(materia: Materia) {
    const alert = await this.alertCtrl.create({
      header: 'Editar nombre de la materia',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          value: materia.nombre,
          placeholder: ''
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

  /**
@function eliminarMateria
@description Muestra una alerta de confirmación y elimina la materia seleccionada si el usuario acepta.
@param { Materia } materia Materia que se desea eliminar.
@return { Promise<void> } Retorna una promesa cuando la materia ha sido eliminada.
*/
  async eliminarMateria(materia: Materia) {
    if (!this.user) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la materia "${materia.nombre}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('El usuario canceló la eliminación.');
          }
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              if (!materia.id) {
                console.error('No se puede eliminar la materia: no tiene ID');
                return;
              }

              await deleteDoc(doc(db, 'usuarios', this.user.uid, 'materias', materia.id));

              this.materias = this.materias.filter(m => m.id !== materia.id);

              console.log(`Materia "${materia.nombre}" eliminada correctamente`);
            } catch (error) {
              console.error('Error eliminando materia:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }
  /**
  @function cambiarFotoMateria
  @description Permite cambiar la imagen de una materia, subiendo una imagen desde el dispositivo.
  @param { Materia } materia Materia a la que se le cambiará la foto.*/

  cambiarFotoMateria(materia: Materia) {
    if (Capacitor.getPlatform() === 'web') {
      this.fileInput.nativeElement.click();
    } else {
      this.cambiarFotoMateriaMovil(materia);
    }
  }

  /**
@function cambiarFotoMateriaMovil
@description Abre la galería en dispositivos móviles para seleccionar una nueva foto de materia.
@param { Materia } materia Materia a la que se le cambiará la imagen.
@return { Promise<void> } Retorna una promesa cuando la imagen ha sido seleccionada y guardada.
*/
  async cambiarFotoMateriaMovil(materia: Materia) {
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
  }

  /**
@function onFileSelected
@description Carga y asigna una imagen seleccionada desde el navegador a la materia.
@param { any } event Evento del input file.
@param { Materia } materia Materia a la que se le asignará la imagen.*/

  onFileSelected(event: any, materia: Materia) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      materia.imagen = reader.result as string;
      this.guardarMaterias();
    };
    reader.readAsDataURL(file);
  }

  /**
@function eliminarFoto
@description Elimina la foto subida por el usuario.
@param { Materia } materia Materia a la que se le eliminará la foto personalizada.*/
  eliminarFoto(materia: Materia) {
    materia.imagen = 'assets/default.png';
    this.guardarMaterias();
  }

  /**
@function descargarMateria
@description Descarga todos los archivos de una materia en formato ZIP.
@param { Materia } materia Materia cuyos archivos se desean descargar.
@return { Promise<void> } Retorna una promesa cuando la descarga ha finalizado.
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
      // Descargar archivos y agregarlos al ZIP
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

      if (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android') {
        // Guardar el archivo como ZIP en el almacenamiento del dispositivo móvil usando Filesystem
        const result = await Filesystem.writeFile({
          path: `${materia.nombre}.zip`,
          data: content,
          directory: FilesystemDirectory.Documents,
        });

        // Abrir el archivo en una aplicación compatible en el dispositivo (solo iOS/Android)
        const alert = await this.alertCtrl.create({
          header: 'Archivo guardado',
          message: 'El archivo ha sido guardado en tu dispositivo.',
          buttons: [{
            text: 'Abrir',
            handler: async () => {
              await Filesystem.requestPermissions();
              const fileUrl = result.uri; // URL del archivo guardado
              const browser = window.open(fileUrl, '_system'); // Abre el archivo en una aplicación externa (solo en móvil)
              browser?.close();
            }
          }]
        });
        await alert.present();
      } else {
        // Para plataformas de escritorio, usar FileSaver.js
        FileSaver.saveAs(content, `${materia.nombre}.zip`);
      }
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

  /**
@function guardarMaterias
@description Guarda todas las materias en Firestore, actualizando sus cambios locales.
@return { Promise<void> } Retorna una promesa cuando las materias han sido guardadas correctamente.*/
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

  /**
@function initPublicaStr
@description Inicializa el valor en texto de la propiedad “publica” para todas las materias.*/
  initPublicaStr() {
    this.materias.forEach(m => m.publicaStr = m.publica ? 'true' : 'false');
  }

  /**
@function abrirSelectorFoto
@description Abre el selector de archivos para elegir una nueva foto para la materia.
@param { Materia } materia Materia que recibirá la nueva imagen.*/
  abrirSelectorFoto(materia: Materia) {
    const inputEl = document.getElementById('file-' + materia.id) as HTMLInputElement;
    if (inputEl) {
      inputEl.click();
    }
  }

  /**
@function onCambioPublica
@description Cambia el estado público o privado de una materia y lo guarda en Firestore.
@param { any } materia Objeto de la materia a actualizar.
@param { any } event Evento con el valor del cambio.
@return { Promise<void> } Retorna una promesa cuando se actualiza el estado en Firestore.
*/
  async onCambioPublica(materia: any, event: any) {
    materia.publica = event.detail.value === 'true';
    materia.publicaStr = event.detail.value;

    try {
      await this.guardarMaterias();
      console.log(`Materia ${materia.nombre} actualizada → pública: ${materia.publica}`);
    } catch (error) {
      console.error('Error guardando cambio de estado público:', error);
    }
  }


  /**
  @function cargarMaterias
  @description Carga todas las materias del usuario actual desde Firestore y las guarda en el arreglo local.
  @return { Promise<void> } Retorna una promesa cuando las materias se han cargado correctamente.
  */
  async cargarMaterias() {
    const user = getAuth().currentUser;
    if (!user) return;

    await this.spinner.run(async () => {
      try {
        const materiasRef = collection(db, 'usuarios', user.uid, 'materias');
        const snapshot = await getDocs(materiasRef);
        this.materias = snapshot.docs.map(d => {
          const materia = { id: d.id, ...d.data() } as Materia;
          materia.expandida = false;
          return materia;
        });
      } catch (error) {
        console.error('Error al cargar materias:', error);
      }
    }, 'Cargando materias...');
  }

}

