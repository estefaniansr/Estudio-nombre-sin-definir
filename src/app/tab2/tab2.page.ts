import { Component } from '@angular/core';
import { IonicModule, IonInput } from '@ionic/angular';
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

  constructor(private filestackService: FilestackService) {
    this.cargarMaterias();
  }
async subirArchivo(materia: Materia) {
    try {
      const result: any = await this.filestackService.openPicker();
      const fileUrl = result.filesUploaded[0].url;

      if (!materia.archivos) {
        materia.archivos = [];
      }
      materia.archivos.push(fileUrl);

      this.guardarMaterias();
    } catch (error) {
      console.error('Error subiendo archivo:', error);
    }
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

  toggleFavorito(materia: Materia) {
    materia.favorito = !materia.favorito;
    this.guardarMaterias();
  }

  eliminarTitulo(materia: Materia, index: number) {
    materia.titulos.splice(index, 1);
    this.guardarMaterias();
  }

  editarMateria(materia: Materia) {
    const nuevoNombre = prompt('Editar nombre de la materia:', materia.nombre);
    if (nuevoNombre !== null && nuevoNombre.trim() !== '') {
      materia.nombre = nuevoNombre.trim();
      localStorage.setItem('materias', JSON.stringify(this.materias));
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
        resultType: CameraResultType.DataUrl, // Devuelve base64
        source: CameraSource.Photos // Galería del dispositivo
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
    if (data) {
      this.materias = JSON.parse(data);
    }
  }
}
