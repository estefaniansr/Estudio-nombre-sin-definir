import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
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

  // Sección activa principal
  seccionActiva: 'seguridad' | 'notificaciones' | 'privacidad' | null = null;

  // Subsección editar perfil
  editarPerfilAbierto: boolean = false;

  // Datos de notificaciones y privacidad
  notificaciones = {
    push: true,
    email: false
  };

  privacidad = {
    perfilPrivado: false,
    mostrarActividad: true
  };

  constructor(private router: Router, private toastCtrl: ToastController) {
    onAuthStateChanged(auth, (u) => {
      this.user = u;
      if (this.user) this.cargarDatosUsuario(this.user.uid);
    });
  }

  // Toggle de sección principal
  toggleSeccion(seccion: 'seguridad' | 'notificaciones' | 'privacidad') {
    this.seccionActiva = this.seccionActiva === seccion ? null : seccion;
    // Al cambiar de sección, cerramos el formulario de editar perfil
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

  restablecerPassword() {
    if (!this.user?.email) {
      alert('No se encontró tu correo registrado');
      return;
    }

    sendPasswordResetEmail(auth, this.user.email)
      .then(() => alert('Se ha enviado un correo de restablecimiento'))
      .catch(err => {
        console.error(err);
        alert(err.message || 'No se pudo enviar el correo');
      });
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
    const confirmacion = confirm(
      '¿Estás seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    if (!confirmacion) return;

    try {
      await deleteUser(this.user);
      alert('Cuenta eliminada correctamente');
      this.user = null;
      this.router.navigate(['/tabs/tab1']);
    } catch (error: any) {
      console.error('Error eliminando cuenta:', error);
      alert(error.message || 'No se pudo eliminar la cuenta');
    }
  }

  async cambiarContrasena() {
    const nuevaPass = prompt('Ingresa tu nueva contraseña:');
    if (!nuevaPass || !this.user) return;

    try {
      await updatePassword(this.user, nuevaPass);
      alert('Contraseña cambiada');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'No se pudo cambiar la contraseña');
    }
  }

  async cambiarCorreo() {
    const nuevoEmail = prompt('Ingresa tu nuevo correo:');
    if (!nuevoEmail || !this.user) return;

    try {
      await updateEmail(this.user, nuevoEmail);
      alert('Correo actualizado\nVerificá tu nuevo correo');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'No se pudo cambiar el correo');
    }
  }
}
