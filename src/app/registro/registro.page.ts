import { Component } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
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

  constructor(private router: Router, private alertCtrl: AlertController) {}

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleRepPassword() {
    this.repPasswordVisible = !this.repPasswordVisible;
  }

  async mostrarAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async registrarUsuario() {
    if (!this.email || !this.password || !this.repPassword || !this.nombre || !this.fecha) {
      await this.mostrarAlert('Error', 'Completa todos los campos');
      return;
    }

    if (this.password !== this.repPassword) {
      await this.mostrarAlert('Error', 'Las contraseñas no coinciden');
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

      await this.mostrarAlert(
        'Registro exitoso',
        'Te enviamos un correo de verificación. Revisá tu bandeja de entrada (o spam).'
      );

    } catch (error: any) {
      console.error(error);
      await this.mostrarAlert('Error', error.message || 'Error al registrarse');
    }
  }

  irLogin() {
    this.router.navigate(['/tabs/tab1']);
  }
}
