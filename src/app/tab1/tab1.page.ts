import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,            // 🔹 cambiamos a true
  imports: [IonicModule, CommonModule, FormsModule] // 🔹 necesarios para ion-*
})
export class Tab1Page {

  constructor(private router: Router) {}

  iniciarSesion(usuario: string, password: string) {
    console.log('Usuario:', usuario);
    console.log('Password:', password);

    if (!usuario || !password) {
      alert('Completa todos los campos');
      return;
    }

    this.router.navigate(['/tabs/tab2']); // redirige a Inicio
  }

  irRegistro() {
    this.router.navigate(['/registro']); // Página de registro fuera de tabs
  }
}
