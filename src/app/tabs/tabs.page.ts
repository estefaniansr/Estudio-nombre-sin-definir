import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonicModule, // Necesario para todos los componentes de Ionic
    CommonModule  // Necesario para *ngIf y directivas de Angular
  ]
})
export class TabsPage {
  showTabBar = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Oculta el tab-bar si estás en tab1
        this.showTabBar = !event.url.endsWith('/tab1');
          
      }
      
    });
  }
  
  
}

