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
import { SpinnerService } from '../services/spinner.service';

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

  constructor(private router: Router, private alertCtrl: AlertController, private spinner: SpinnerService) { }

  /**
   * @function togglePassword
   * @description Alterna la visibilidad de la contraseña ingresada por el usuario.   */
  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * @function toggleRepPassword
   * @description Alterna la visibilidad de la contraseña repetida ingresada por el usuario.
   */
  toggleRepPassword() {
    this.repPasswordVisible = !this.repPasswordVisible;
  }

    /**
   * @function mostrarAlert
   * @description Muestra una alerta con un mensaje.
   * @param { string } header El título de la alerta.
   * @param { string } message El mensaje que se muestra en la alerta.
   * @return { Promise<void> } Retorna una promesa que se resuelve cuando la alerta ha sido presentada.
   */
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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

    if (!passwordRegex.test(this.password)) {
      await this.mostrarAlert(
        'Contraseña insegura',
        'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula y una minúscula.'
      );
      return;
    }


    await this.spinner.run(async () => {
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

      this.router.navigate(['/tabs/tab1']);

    }, 'Registrando usuario...');
  }

  irLogin() {
    this.router.navigate(['/tabs/tab1']);
  }
}
