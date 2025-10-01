// src/app/tab1/tab1.page.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase-config'; // Asegurate de que esta ruta sea correcta

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class Tab1Page {
  user: User | null = null;
constructor(private router: Router, private http: HttpClient) {
    // Detecta si ya hay un usuario logueado
    onAuthStateChanged(auth, (u) => {
      this.user = u;
    });
  }

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
      this.user = result.user; // guardamos el usuario

      console.log('Login con Google exitoso:', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      alert('No se pudo iniciar sesión con Google');
    }
  }

  async logout() {
    try {
      await auth.signOut();
      this.user = null;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  irRegistro() {
    this.router.navigate(['/registro']);
  }
}