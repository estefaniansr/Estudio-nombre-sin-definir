import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Materia } from '../models/materia.model';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase-config';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class Tab3Page {
  favoritos: Materia[] = [];
  user: any = null;

  constructor() {
    const auth = getAuth();
    auth.onAuthStateChanged(user => {
      if (user) {
        this.user = user;
        this.cargarFavoritos();
      }
    });
  }

  async cargarFavoritos() {
    if (!this.user) return;

    try {
      const materiasRef = collection(db, 'usuarios', this.user.uid, 'materias');
      const q = query(materiasRef, where('favorito', '==', true));
      const snapshot = await getDocs(q);
      this.favoritos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Materia));
      console.log('Favoritos cargados', this.favoritos);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    }
  }

  abrirArchivo(url: string) {
  window.open(url, '_blank');
}

}


