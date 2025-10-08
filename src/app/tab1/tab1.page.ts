import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  User,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  GithubAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
})
export class Tab1Page {
  user: User | null = null;
  nombre: string = '';
  fecha: string = '';
  passwordVisible: boolean = false;
  ajustesAbiertos: boolean = false;
  editarPerfilAbierto: boolean = false;
  intentosFallidos: number = 0;
  bloqueadoHasta: number | null = null;

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    onAuthStateChanged(auth, (u) => {
      this.user = u;
      if (this.user) this.cargarDatosUsuario(this.user.uid);
    });
  }

  // Método para ir a Ajustes
  irAjustes() {
    this.router.navigate(['/ajustes']);
  }

  async mostrarToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'primary'
    });
    toast.present();
  }

  async mostrarAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async cargarDatosUsuario(uid: string) {
    try {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        this.nombre = data.nombre;
        this.fecha = data.fecha;

        try {
          const fechanueva = this.fecha.split("-");
          this.fecha = fechanueva[2] + "/" + fechanueva[1] + "/" + fechanueva[0];
        } catch (error) {}
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  }

  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleAjustes() {
    this.ajustesAbiertos = !this.ajustesAbiertos;
  }

  toggleEditarPerfil() {
    this.editarPerfilAbierto = !this.editarPerfilAbierto;
  }

  async iniciarSesion(usuario: string, password: string) {

    if (!usuario || !password) {
      await this.mostrarAlert('Error', 'Completa todos los campos');
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, usuario, password);
      const user = result.user;

      if (!user.emailVerified) {
        await this.mostrarAlert(
          'Correo no verificado',
          'Tu correo no está verificado. Revisa tu bandeja de entrada y haz clic en el enlace de verificación antes de iniciar sesión.'
        );
        await auth.signOut();
        return;
      }

      this.intentosFallidos = 0;
      this.bloqueadoHasta = null;

      this.user = user;
      await this.cargarDatosUsuario(user.uid);
      this.router.navigate(['/tabs/tab2']);
    } catch (error: any) {
      console.error('Error login:', error);

      // Manejo de errores específico
      let mensaje = 'Error al iniciar sesión';
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          mensaje = 'Correo o contraseña incorrectos';
          break;
        case 'auth/too-many-requests':
          mensaje = 'Se han realizado demasiados intentos. Esperá un momento e intentá de nuevo.';
          break;
        default:
          mensaje = error.message || 'Error al iniciar sesión';
      }

      await this.mostrarAlert('Error', mensaje);
    }
  }

  async olvidePassword(usuario: string) {
    if (!usuario) {
      await this.mostrarAlert('Error', 'Ingresá tu correo para restablecer la contraseña');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, usuario);
      await this.mostrarAlert(
        'Correo enviado',
        'Te enviamos un correo para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam).'
      );
    } catch (error: any) {
      console.error('Error restableciendo contraseña:', error);
      await this.mostrarAlert('Error', error.message || 'No se pudo enviar el correo de restablecimiento');
    }
  }

  async restablecerPassword() {
    if (!this.user?.email) {
      await this.mostrarAlert('Error', 'No se encontró tu correo registrado');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, this.user.email);
      await this.mostrarAlert(
        'Correo enviado',
        'Se ha enviado un correo de restablecimiento. Revisá tu bandeja de entrada (y spam).'
      );
    } catch (error: any) {
      console.error('Error restableciendo contraseña:', error);
      await this.mostrarAlert('Error', error.message || 'No se pudo enviar el correo de restablecimiento');
    }
  }

  async loginConGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      this.user = result.user;
      if (this.user) await this.cargarDatosUsuario(this.user.uid);
      console.log('Login con Google exitoso:', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      await this.mostrarAlert('Error', 'No se pudo iniciar sesión con Google');
    }
  }

  async loginConGithub() {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      this.user = result.user;
      if (this.user) await this.cargarDatosUsuario(this.user.uid);
      console.log('Login con GitHub exitoso:', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error: any) {
      console.error('Error al iniciar sesión con GitHub:', error);
      await this.mostrarAlert('Error', error.message || 'No se pudo iniciar sesión con GitHub');
    }
  }

  async guardarPerfil() {
    if (!this.nombre || !this.fecha) {
      this.mostrarToast('Completa todos los campos');
      return;
    }
    if (!this.user) return;

    try {
      await setDoc(doc(db, 'usuarios', this.user.uid), { nombre: this.nombre, fecha: this.fecha, email: this.user.email }, { merge: true });
      await updateProfile(this.user, { displayName: this.nombre });
      this.mostrarToast('Perfil actualizado');
      this.editarPerfilAbierto = false;
    } catch (error: any) {
      console.error(error);
      this.mostrarToast('No se pudo actualizar el perfil');
    }
  }

  irRegistro() {
    this.router.navigate(['/registro']);
  }
}
