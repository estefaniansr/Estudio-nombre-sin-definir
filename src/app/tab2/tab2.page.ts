import { Component } from '@angular/core';
import { IonicModule, IonInput, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FilestackService } from '../services/filestack.service';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Tab2Page {
  materias: Materia[] = [];

  constructor(private filestackService: FilestackService, private alertCtrl: AlertController) {
    this.cargarMaterias();
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

  async subirArchivo(materia: Materia) {
    try {
      const result: any = await this.filestackService.openPicker();
      const fileUrl = result.filesUploaded[0].url;

      const nombreArchivo = await this.mostrarPrompt('Nombre del archivo', 'Archivo sin nombre');
      if (nombreArchivo === null) return;

      if (!materia.archivos) materia.archivos = [];
      materia.archivos.push({ url: fileUrl, nombre: nombreArchivo.trim() || 'Archivo sin nombre' });
      this.guardarMaterias();
    } catch (error) {
      console.error('Error subiendo archivo:', error);
    }
  }

  eliminarArchivo(materia: Materia, archivo: { url: string, nombre: string }) {
    materia.archivos = materia.archivos?.filter(a => a.url !== archivo.url);
    this.guardarMaterias();
  }

  agregarMateria() {
    const nuevaMateria: Materia = {
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
  }

  eliminarTitulo(materia: Materia, index: number) {
    materia.titulos.splice(index, 1);
    this.guardarMaterias();
  }

  async editarMateria(materia: Materia) {
    // Igual que la descripción, abrimos un prompt nativo de Ionic
    const nuevoNombre = await this.mostrarPrompt('Editar nombre de la materia', materia.nombre);
    if (nuevoNombre !== null && nuevoNombre.trim() !== '') {
      materia.nombre = nuevoNombre.trim();
      this.guardarMaterias();
    }
  }

  eliminarMateria(materia: Materia) {
    this.materias = this.materias.filter(m => m !== materia);
    this.guardarMaterias();
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
  }

  eliminarFoto(materia: Materia) {
    materia.imagen = 'assets/default.png';
    this.guardarMaterias();
  }

  guardarMaterias() {
    localStorage.setItem('materias', JSON.stringify(this.materias));
  }

  cargarMaterias() {
    const data = localStorage.getItem('materias');
    if (data) this.materias = JSON.parse(data);
  }
}
