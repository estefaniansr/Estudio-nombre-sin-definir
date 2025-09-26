// src/app/tab1/tab1.page.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase-config'; // Asegurate de que esta ruta sea correcta

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class Tab1Page {

  constructor(private router: Router, private http: HttpClient) { }

  iniciarSesion(usuario: string, password: string) {
    if (!usuario || !password) {
      alert('Completa todos los campos');
      return;
    }

    this.http.post('http://127.0.0.1:3000/login', { email: usuario, password }, { withCredentials: true })
      .subscribe({
        next: (res: any) => {
          console.log('Login exitoso:', res);
          this.router.navigate(['/tabs/tab2']);
        },
        error: (err) => {
          console.error('Error login:', err);
          alert(err.error?.error || 'Error al conectarse al servidor');
        }
      });
  }

  async loginConGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('Login con Google exitoso:', user);
      alert(`Bienvenido, ${user.displayName}`);
      
      // Aquí podrías enviar el user.email a tu backend si querés registrarlo/loguearlo
      this.router.navigate(['/tabs/tab2']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      alert('No se pudo iniciar sesión con Google');
    }
  }

  irRegistro() {
    this.router.navigate(['/registro']);
  }
}
