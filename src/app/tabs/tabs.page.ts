import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { auth } from '../../firebase-config'; // tu config de Firebase
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class TabsPage {
  showTabBar = false;
  user: User | null = null;

  constructor(private router: Router) {
    // Detecta usuario logueado
    onAuthStateChanged(auth, (u) => {
      this.user = u;
      this.updateTabBar(this.router.url);
    });

    // Detecta cambios de ruta
    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateTabBar(event.url);
      });
  }

  private updateTabBar(url: string) {
    // Si estamos en Tab1, solo mostrar barra si hay usuario
    if (url.endsWith('/tab1')) {
      this.showTabBar = !!this.user;
    } else {
      this.showTabBar = true; // otros tabs siempre muestran barra
    }
  }
}
