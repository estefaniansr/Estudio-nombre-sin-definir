import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Materia } from '../models/materia.model';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase-config';
import { onAuthStateChanged } from 'firebase/auth';

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

  constructor() {}

 async ngOnInit() {
  // Esperar al usuario actual
  this.currentUserEmail = await new Promise<string | null>(resolve => {
    onAuthStateChanged(auth, user => resolve(user?.email || null));
  });

  await this.cargarMaterias();
}


  async cargarMaterias() {
    try {
      this.materias = [];

      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));

      // Traer las materias de todos los usuarios en paralelo
      const promesas = usuariosSnapshot.docs.map(async userDoc => {
        const materiasRef = collection(db, 'usuarios', userDoc.id, 'materias');
        const materiasSnapshot = await getDocs(materiasRef);

        return materiasSnapshot.docs.map(m => ({ id: m.id, ...m.data() } as Materia));
      });

      // Esperar a que todas terminen y aplanar el array
      const todasMaterias = await Promise.all(promesas);
      this.materias = todasMaterias.flat();

      console.log('Materias de todos los usuarios cargadas:', this.materias);

    } catch (error) {
      console.error('Error cargando materias de la comunidad:', error);
    }
  }

  esPropia(materia: Materia): boolean {
    if (!materia.archivos) return false;
    return materia.archivos.some(a => a.subidoPor === this.currentUserEmail);
  }
}
