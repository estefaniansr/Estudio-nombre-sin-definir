import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  User,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  updateProfile,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

@Component({
  selector: 'app-ajustes',
  templateUrl: './ajustes.page.html',
  styleUrls: ['./ajustes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
})
export class AjustesPage {
  user: User | null = null;
  nombre: string = '';
  fecha: string = '';

  seccionActiva: 'seguridad' | 'notificaciones' | 'privacidad' | null = null;
  editarPerfilAbierto: boolean = false;

  notificaciones = { push: true, email: false };
  privacidad = { perfilPrivado: false, mostrarActividad: true };

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

  toggleSeccion(seccion: 'seguridad' | 'notificaciones' | 'privacidad') {
    this.seccionActiva = this.seccionActiva === seccion ? null : seccion;
    if (seccion !== 'seguridad') this.editarPerfilAbierto = false;
  }

  toggleEditarPerfil() {
    this.editarPerfilAbierto = !this.editarPerfilAbierto;
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

  async mostrarPrompt(header: string, placeholder: string): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header,
        inputs: [{ name: 'input', type: 'text', placeholder }],
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(null) },
          { text: 'Aceptar', handler: (data) => resolve(data.input) }
        ]
      });
      await alert.present();
    });
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

  volverPerfil() {
    this.router.navigate(['/tabs/tab1']);
  }

  async guardarPerfil() {
    if (!this.nombre || !this.fecha || !this.user) {
      this.mostrarToast('Completa todos los campos');
      return;
    }

    try {
      await setDoc(doc(db, 'usuarios', this.user.uid), {
        nombre: this.nombre,
        fecha: this.fecha,
        email: this.user.email
      }, { merge: true });
      await updateProfile(this.user, { displayName: this.nombre });
      this.mostrarToast('Perfil actualizado');
      this.editarPerfilAbierto = false;
    } catch (error: any) {
      console.error(error);
      this.mostrarToast('No se pudo actualizar el perfil');
    }
  }

  async restablecerPassword() {
    if (!this.user?.email) {
      await this.mostrarAlert('Error', 'No se encontró tu correo registrado');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, this.user.email);
      await this.mostrarAlert('Correo enviado', 'Se ha enviado un correo de restablecimiento. Revisá tu bandeja de entrada (y spam).');
    } catch (error: any) {
      console.error(error);
      await this.mostrarAlert('Error', error.message || 'No se pudo enviar el correo');
    }
  }

  async logout() {
    try {
      await auth.signOut();
      this.user = null;
      this.nombre = '';
      this.fecha = '';
      this.seccionActiva = null;
      this.editarPerfilAbierto = false;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  async eliminarCuenta() {
    if (!this.user) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await deleteUser(this.user!);
              await this.mostrarAlert('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.');
              this.user = null;
              this.router.navigate(['/tabs/tab1']);
            } catch (error: any) {
              console.error('Error eliminando cuenta:', error);
              await this.mostrarAlert('Error', error.message || 'No se pudo eliminar la cuenta');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async cambiarContrasena() {
    const nuevaPass = await this.mostrarPrompt('Cambiar contraseña', 'Ingresa tu nueva contraseña');
    if (!nuevaPass || !this.user) return;

    try {
      await updatePassword(this.user, nuevaPass);
      await this.mostrarAlert('Éxito', 'Contraseña cambiada correctamente');
    } catch (error: any) {
      console.error(error);
      await this.mostrarAlert('Error', error.message || 'No se pudo cambiar la contraseña');
    }
  }

  async cambiarCorreo() {
    const nuevoEmail = await this.mostrarPrompt('Cambiar correo', 'Ingresa tu nuevo correo');
    if (!nuevoEmail || !this.user) return;

    try {
      await updateEmail(this.user, nuevoEmail);
      await this.mostrarAlert('Éxito', 'Correo actualizado. Verificá tu nuevo correo.');
    } catch (error: any) {
      console.error(error);
      await this.mostrarAlert('Error', error.message || 'No se pudo cambiar el correo');
    }
  }
}
