import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
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
  updateEmail,
  updatePassword,
  updateProfile,
  deleteUser
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


  constructor(private router: Router, private toastCtrl: ToastController) {
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

  async cargarDatosUsuario(uid: string) {
    try {
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        this.nombre = data.nombre;
        this.fecha = data.fecha;
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
      alert('Completa todos los campos');
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, usuario, password);
      const user = result.user;

      if (!user.emailVerified) {
        alert(
          'Tu correo no está verificado.\n\nRevisa tu bandeja de entrada y hacé clic en el enlace de verificación antes de iniciar sesión.'
        );
        await auth.signOut();
        return;
      }

      this.user = user;
      await this.cargarDatosUsuario(user.uid);

      console.log('Login exitoso:', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error: any) {
      console.error('Error login:', error);
      alert(error.message || 'Error al iniciar sesión');
    }
  }

  async olvidePassword(usuario: string) {
    if (!usuario) {
      alert('Ingresá tu correo para restablecer la contraseña');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, usuario);
      alert(
        'Te enviamos un correo para restablecer tu contraseña. Revisá tu bandeja de entrada (y spam).'
      );
    } catch (error: any) {
      console.error('Error restableciendo contraseña:', error);
      alert(error.message || 'No se pudo enviar el correo de restablecimiento');
    }
  }



  restablecerPassword() {
    if (!this.user?.email) {
      alert('No se encontró tu correo registrado');
      return;
    }

    sendPasswordResetEmail(auth, this.user.email)
      .then(() => {
        alert(
          'Se ha enviado un correo de restablecimiento. Revisá tu bandeja de entrada (y spam).'
        );
      })
      .catch((error) => {
        console.error('Error restableciendo contraseña:', error);
        alert(error.message || 'No se pudo enviar el correo de restablecimiento');
      });
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
      alert('No se pudo iniciar sesión con Google');
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
      alert(error.message || 'No se pudo iniciar sesión con GitHub');
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
