import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  createUserWithEmailAndPassword,
  User,
  sendEmailVerification,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../../firebase-config';
import { doc, setDoc } from 'firebase/firestore';



@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})

export class RegistroPage {
  email: string = '';
  password: string = '';
  repPassword: string = '';
  nombre: string = '';
  fecha: string = '';


  passwordVisible: boolean = false;
  repPasswordVisible: boolean = false;

  constructor(private router: Router) { }

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleRepPassword() {
    this.repPasswordVisible = !this.repPasswordVisible;
  }


  mensajeVerificacion: string = '';
  linkGmail: string = '';

  async registrarUsuario() {
    if (!this.email || !this.password || !this.repPassword || !this.nombre || !this.fecha) {
      this.mensajeVerificacion = 'Completa todos los campos';
      return;
    }

    if (this.password !== this.repPassword) {
      this.mensajeVerificacion = 'Las contraseñas no coinciden';
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, this.email, this.password);
      const user: User = result.user;

      await setDoc(doc(db, 'usuarios', user.uid), {
        nombre: this.nombre,
        fecha: this.fecha,
        email: this.email
      });

      await updateProfile(user, { displayName: this.nombre });
      await sendEmailVerification(user);
      await signOut(auth);

      // 🔹 Mostrar mensaje en la app con link
      this.mensajeVerificacion = 'Registro exitoso. Te enviamos un correo de verificación. Revisá tu bandeja de entrada (o spam).';
      this.linkGmail = 'https://mail.google.com/mail/u/0/#inbox/';

    } catch (error: any) {
      console.error(error);
      this.mensajeVerificacion = error.message || 'Error al registrarse';
    }
  }

  irLogin() {
    this.router.navigate(['/tabs/tab1']);
  }
}
