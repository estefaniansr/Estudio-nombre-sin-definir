import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { auth } from '../../firebase-config';
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
    onAuthStateChanged(auth, (u) => {
      this.user = u;
      this.updateTabBar(this.router.url);
    });

    this.router.events.pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateTabBar(event.url);
      });
  }

  /**
@function updateTabBar
@description Controla la visibilidad de la barra de pestañas (TabBar) dependiendo de la URL actual. Si estamos en Tab1 y no hay usuario logueado, la barra de pestañas se oculta.
@param { string } url La URL de la ruta actual, utilizada para determinar si debemos mostrar la barra de pestañas.*/

  private updateTabBar(url: string) {
    if (url.endsWith('/tab1')) {
      this.showTabBar = !!this.user;
    } else {
      this.showTabBar = true; 
    }
  }
}
