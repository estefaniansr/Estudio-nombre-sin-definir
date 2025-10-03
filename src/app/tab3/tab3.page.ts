import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Materia } from '../models/materia.model';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})


export class Tab3Page {
  favoritos: Materia[] = [];

  constructor() {
    this.cargarFavoritos();
  }

  cargarFavoritos() {
    const data = localStorage.getItem('materias');
    if (data) {
      const materias: Materia[] = JSON.parse(data);
      this.favoritos = materias.filter(m => m.favorito);
    }
  }

}

