import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { User, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
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

  constructor(private router: Router) {
    // Detecta si ya hay un usuario logueado
    onAuthStateChanged(auth, (u) => {
      this.user = u;
    });
  }

  // 🔹 Cambio: inicio de sesión usando Firebase Email/Password
  async iniciarSesion(usuario: string, password: string) {
    if (!usuario || !password) {
      alert('Completa todos los campos');
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, usuario, password);
      this.user = result.user;
      console.log('Login exitoso:', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error: any) {
      console.error('Error login:', error);
      alert(error.message || 'Error al iniciar sesión');
    }
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
