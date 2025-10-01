import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { createUserWithEmailAndPassword, User } from 'firebase/auth';
import { auth } from '../../firebase-config';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegistroPage {

  email: string = '';
  password: string = '';
  repPassword: string = '';
  nombre: string = '';
  fecha: string = '';

  constructor(private router: Router) {}

  // 🔹 Aquí está el método que tu HTML llama
  async registrarUsuario() {
    if (!this.email || !this.password || !this.repPassword) {
      alert('Completa todos los campos');
      return;
    }

    if (this.password !== this.repPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, this.email, this.password);
      const user: User = result.user;
      console.log('Usuario registrado:', user);
      alert('Registro exitoso 🎉');
      this.router.navigate(['/tabs/tab1']);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error al registrarse');
    }
  }

  irLogin() {
    this.router.navigate(['/tabs/tab1']);
  }
}
