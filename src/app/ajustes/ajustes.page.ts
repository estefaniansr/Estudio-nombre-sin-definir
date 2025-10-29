import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import {
  User,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { SpinnerService } from '../services/spinner.service';

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

  seccionActiva: 'seguridad' | 'idioma' | 'tema' | 'soporte' | null = null;
  editarPerfilAbierto: boolean = false;
  preferenciaAccion: 'descargar' | 'favoritos' | 'editarTitulo' = 'descargar';

  modoOscuro = false;

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private spinner: SpinnerService
  ) {
    onAuthStateChanged(auth, (u) => {
      this.user = u;
      if (this.user) this.cargarDatosUsuario(this.user.uid);
    });
  }


  /**
 * @function toggleSeccion
 * @description Abre o cierra una sección del menú de ajustes.
 * @param { 'seguridad' | 'idioma' | 'tema' | 'soporte' } seccion - La sección que se desea alternar.
 */
  toggleSeccion(seccion: 'seguridad' | 'idioma' | 'tema' | 'soporte') {
    this.seccionActiva = this.seccionActiva === seccion ? null : seccion;
    if (seccion !== 'seguridad') this.editarPerfilAbierto = false;
  }


  /**
   * @function toggleEditarPerfil
   * @description Alterna la visibilidad del formulario de edición del perfil del usuario.
   */
  toggleEditarPerfil() {
    this.editarPerfilAbierto = !this.editarPerfilAbierto;
  }

  /**
 * @function mostrarToast
 * @description Muestra un mensaje flotante en pantalla durante 4 segundos.
 * @param { string } message - El mensaje que se mostrará en el toast.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando el toast se muestra.
 */
  async mostrarToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000, // 4 segundos
      position: 'top',
      color: 'primary'
    });
    toast.present();
  }

  /**
 * @function mostrarAlert
 * @description Muestra una alerta con título y mensaje.
 * @param { string } header - El título de la alerta.
 * @param { string } message - El contenido del mensaje que se mostrará.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando la alerta es presentada.
 */
  async mostrarAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  /**
 * @function cargarDatosUsuario
 * @description Carga los datos del usuario desde Firestore.
 * @param { string } uid - El identificador único del usuario autenticado.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando los datos se cargan correctamente.
 */
  async cargarDatosUsuario(uid: string) {
    await this.spinner.run(async () => {
      try {
        const docRef = doc(db, 'usuarios', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          this.nombre = data.nombre;
          this.fecha = data.fecha;
          this.preferenciaAccion = data.preferenciaAccion || 'descargar';
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }
    }, 'Cargando datos del usuario...');
  }

  /**
 * @function volverPerfil
 * @description Redirige al usuario a la página principal del perfil.
 */
  volverPerfil() {
    this.router.navigate(['/tabs/tab1']);
  }

  /**
   * @function guardarPerfil
   * @description Guarda los cambios del perfil del usuario (nombre, fecha, email) en Firestore y actualiza su perfil de Firebase.
   * @return { Promise<void> } Retorna una promesa que se resuelve cuando la actualización se completa.
   */
  async guardarPerfil() {
    if (!this.nombre || !this.fecha || !this.user) {
      this.mostrarToast('Completa todos los campos');
      return;
    }

    const user = this.user;

    await this.spinner.run(async () => {
      try {
        await setDoc(doc(db, 'usuarios', user.uid), {
          nombre: this.nombre,
          fecha: this.fecha,
          email: user.email ?? ''
        }, { merge: true });

        await updateProfile(user, { displayName: this.nombre });

        this.mostrarToast('Perfil actualizado');
        this.editarPerfilAbierto = false;
      } catch (error: any) {
        console.error(error);
        this.mostrarToast('No se pudo actualizar el perfil');
      }
    }, 'Guardando cambios...');
  }

  /**
 * @function restablecerPassword
 * @description Envía un correo electrónico al usuario para restablecer su contraseña.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando el correo se envía o si ocurre un error.
 */
  async restablecerPassword() {
    if (!this.user?.email) {
      await this.mostrarAlert('Error', 'No se encontró tu correo registrado');
      return;
    }

    const email = this.user.email; 

    await this.spinner.run(async () => {
      try {
        await sendPasswordResetEmail(auth, email);
        await this.mostrarAlert(
          'Correo enviado',
          'Se ha enviado un correo de restablecimiento. Revisá tu bandeja de entrada (y spam).'
        );
      } catch (error: any) {
        console.error(error);
        await this.mostrarAlert('Error', error.message || 'No se pudo enviar el correo');
      }
    }, 'Enviando correo de restablecimiento...');
  }

  /**
 * @function logout
 * @description Cierra la sesión del usuario actual y lo redirige al Login.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando el cierre de sesión finaliza.
 */
  async logout() {
    await this.spinner.run(async () => {
      try {
        await auth.signOut();
        this.user = null;
        this.nombre = '';
        this.fecha = '';
        this.seccionActiva = null;
        this.editarPerfilAbierto = false;
        await this.mostrarAlert('Sesión cerrada', '');
        this.router.navigate(['/tabs/tab1']);
      } catch (error) {
        console.error('Error cerrando sesión:', error);
      }
    }, 'Cerrando sesión...');
  }

  /**
 * @function eliminarCuenta
 * @description Muestra una alerta de confirmación y elimina la cuenta del usuario tanto de Firebase Authentication como de Firestore.
 * @return { Promise<void> } Retorna una promesa que se resuelve cuando la cuenta es eliminada o si ocurre un error.
 */
  async eliminarCuenta() {
    if (!this.user) return;

    const user = this.user; 

    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro que querés eliminar tu cuenta? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.spinner.run(async () => {
              try {
                await deleteUser(user);

                await deleteDoc(doc(db, 'usuarios', user.uid))

                await this.mostrarAlert('Cuenta eliminada', 'Tu cuenta fue eliminada correctamente.');
                this.user = null;
                this.router.navigate(['/tabs/tab1']);
              } catch (error: any) {
                console.error('Error eliminando cuenta:', error);
                await this.mostrarAlert('Error', error.message || 'No se pudo eliminar la cuenta');
              }
            }, 'Eliminando cuenta...');
          }
        }
      ]
    });
    await alert.present();
  }

  /**
 * @function contactarSoporte
 * @description Abre Gmail en una nueva pestaña con un correo prellenado para contactar al soporte técnico de la aplicación.
 */
  contactarSoporte() {
    const email = 'desarollomoviltp@gmail.com';
    const subject = encodeURIComponent('Soporte App');
    const body = encodeURIComponent('Hola, necesito ayuda con la app...');
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`,
      '_blank'
    );
  }
}
