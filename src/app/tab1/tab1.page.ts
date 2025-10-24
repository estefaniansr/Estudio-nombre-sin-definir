import { Component } from '@angular/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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
  signInWithCredential,
  getRedirectResult,
  signInWithRedirect,
  GithubAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../../firebase-config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SpinnerService } from '../services/spinner.service';

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
@function irAjustes
@description Al ejecutarse redirige a la página de Ajustes del usuario.
*/
  irAjustes() {
    this.router.navigate(['/ajustes']);
  }

  /**
@function mostrarToast
@description Muestra un mensaje tipo Toast en pantalla durante 4 segundos.
@param { string } message Mensaje que se mostrará en el Toast.
@return { Promise<void> } Retorna una promesa cuando el Toast es presentado.
*/

  async mostrarToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'primary'
    });
    toast.present();
  }
  /**
  @function mostrarAlert
  @description Muestra una alerta con un título y un mensaje en pantalla.
  @param { string } header Título o encabezado de la alerta.
  @param { string } message Texto del mensaje que se mostrará.
  @return { Promise<void> } Retorna una promesa cuando la alerta ha sido presentada.
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
@function cargarDatosUsuario
 @description Carga los datos del usuario desde Firestore utilizando su UID y actualiza los valores locales.
@param { string } uid Identificador único del usuario autenticado.
@return { Promise<void> } Retorna una promesa cuando finaliza la carga de los datos del usuario.
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

          try {
            const fechanueva = this.fecha.split("-");
            this.fecha = fechanueva[2] + "/" + fechanueva[1] + "/" + fechanueva[0];
          } catch (error) { }
        }
      } catch (error) {
        console.error('Error cargando datos del usuario:', error);
      }

    }, 'Cargando datos del usuario');
  }

  /**
@function togglePassword
@description Alterna la visibilidad de la contraseña.
*/


  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
@function toggleAjustes
@description Alterna la visualización del panel de ajustes.*/

  toggleAjustes() {
    this.ajustesAbiertos = !this.ajustesAbiertos;
  }

  /**
@function toggleEditarPerfil
@description Muestra u oculta el formulario de edición del perfil del usuario.
*/
  toggleEditarPerfil() {
    this.editarPerfilAbierto = !this.editarPerfilAbierto;
  }

  /**
@function iniciarSesion
@description Inicia sesión con correo y contraseña mediante Firebase Authentication. Valida los campos y verifica el correo del usuario.
@param { string } usuario Correo electrónico del usuario.
@param { string } password Contraseña del usuario.
@return { Promise<void> } Retorna una promesa cuando finaliza el intento de inicio de sesión.
*/
  async iniciarSesion(usuario: string, password: string) {

    if (!usuario || !password) {
      await this.mostrarAlert('Error', 'Completa todos los campos');
      return;
    }

    await this.spinner.run(async () => {
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

        this.user = user;
        await this.cargarDatosUsuario(user.uid);
        this.router.navigate(['/tabs/tab2']);
      } catch (error: any) {
        console.error('Error login:', error);

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
    }, 'Iniciando sesión...');
  }

  async olvidePassword(usuario: string) {
    if (!usuario) {
      await this.mostrarAlert('Error', 'Ingresá tu correo para restablecer la contraseña');
      return;
    }

    /**
@function olvidePassword
@description Envía un correo al usuario para restablecer su contraseña si el correo existe.
@param { string } usuario Correo electrónico del usuario que desea recuperar su contraseña.
@return { Promise<void> } Retorna una promesa cuando se envía el correo o ocurre un error.
*/
    await this.spinner.run(async () => {
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
    }, 'Enviando correo...');
  }

  /**
@function restablecerPassword
@description Envía un correo de restablecimiento de contraseña al correo del usuario.
@return { Promise<void> } Retorna una promesa cuando el correo de restablecimiento ha sido enviado.
*/
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

  /**
@function loginConGoogle
@description Inicia sesión mediante la cuenta de Google, guarda o actualiza los datos del usuario en Firestore y navega a la página principal.
@return { Promise<void> } Retorna una promesa cuando finaliza el proceso de inicio de sesión.
*/
  async loginConGoogle() {
    try {
      const googleUser = await GoogleAuth.signIn();
      console.log('Usuario Google:', googleUser);
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(auth, credential);
      this.user = result.user;

      // Guardar o actualizar datos en Firestore
      await setDoc(doc(db, 'usuarios', this.user.uid), {
        nombre: this.user.displayName,
        fecha: '2025-01-01',
        email: this.user.email
      }, { merge: true });

      // Actualizar displayName de Firebase si es necesario
      await updateProfile(this.user, { displayName: this.user.displayName });

      // Cargar datos locales y navegar a tab2
      if (this.user) await this.cargarDatosUsuario(this.user.uid);
      console.log('Login con Google exitoso:', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error);
      await this.mostrarAlert('Error', 'No se pudo iniciar sesión con Google');
    }
  }

  /**
  @function loginConGithub
  Inicia sesión mediante la cuenta de GitHub, guarda o actualiza los datos del usuario en Firestore y navega a la página principal.
  @return { Promise<void> } Retorna una promesa cuando finaliza el proceso de inicio de sesión.
  */
  async loginConGithub() {
    const provider = new GithubAuthProvider();

    try {
      // Redirige al navegador para autenticarse en GitHub
      await signInWithRedirect(auth, provider);

      // Cuando el usuario regresa de GitHub, obtenemos el resultado
      const result = await getRedirectResult(auth);
      if (!result) return; // Si todavía no hay resultado, salimos

      this.user = result.user;

      // Guardar o actualizar datos en Firestore
      await setDoc(doc(db, 'usuarios', this.user.uid), {
        nombre: this.user.displayName,
        fecha: '2025-01-01',
        email: this.user.email
      }, { merge: true });

      // Actualizar displayName de Firebase
      await updateProfile(this.user, { displayName: this.user.displayName });

      if (this.user) await this.cargarDatosUsuario(this.user.uid);
      console.log('Login con GitHub exitoso (móvil):', this.user);
      this.router.navigate(['/tabs/tab2']);
    } catch (error) {
      console.error('Error login con GitHub (móvil):', error);
      await this.mostrarAlert('Error', 'No se pudo iniciar sesión con GitHub');
    }
  }

  /**
@function guardarPerfil
@description Guarda los cambios del perfil del usuario en Firestore y actualiza su nombre mostrado en Firebase.
@return { Promise<void> } Retorna una promesa cuando el perfil ha sido actualizado.
*/

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

  /**
@function irRegistro
@description Navega a la página de registro para crear una nueva cuenta.
@return { void } No retorna ningún valor.
*/

  irRegistro() {
    this.router.navigate(['/registro']);
  }
}
