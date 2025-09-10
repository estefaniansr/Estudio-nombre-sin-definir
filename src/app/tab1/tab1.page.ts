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

  constructor(private router: Router) { }

  iniciarSesion(usuario: string, password: string) {
    if (!usuario || !password) {
      alert('Completa todos los campos');
      return;
    }

    fetch('http://127.0.0.1:3000/login', {
      method: 'POST',
      credentials: 'include', // para cookies de sesión
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: usuario, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          console.log('Login exitoso', data);
          this.router.navigate(['/tabs/tab2']); // redirige solo si login OK
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al conectarse al servidor');
      });
  }


  irRegistro() {
    this.router.navigate(['/registro']); // Página de registro fuera de tabs
  }
}
