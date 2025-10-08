import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { db } from '../../firebase-config';

@Component({
  selector: 'app-comunidad',
  templateUrl: './comunidad.page.html',
  styleUrls: ['./comunidad.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ComunidadPage implements OnInit {
  materias: Materia[] = [];

  constructor() { }

  async ngOnInit() {
    await this.cargarMaterias();
  }

  async cargarMaterias() {
    try {
      this.materias = [];

      // Traer todos los usuarios
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
      for (const userDoc of usuariosSnapshot.docs) {
        const materiasRef = collection(db, 'usuarios', userDoc.id, 'materias');
        const materiasSnapshot = await getDocs(materiasRef);
        materiasSnapshot.forEach(m => {
          this.materias.push({ id: m.id, ...m.data() } as Materia);
        });
      }

      console.log('Materias de todos los usuarios cargadas:', this.materias);
    } catch (error) {
      console.error('Error cargando materias de la comunidad:', error);
    }
  }
}
