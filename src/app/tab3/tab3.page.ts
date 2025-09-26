import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase-config'; // Asegurate de que la ruta sea correcta

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {

  constructor(private router: Router) {}

  cerrarSesion() {
    signOut(auth)
      .then(() => {
        alert('Sesión cerrada 👋');
        this.router.navigate(['/tabs/tab1']); // O donde tengas tu login
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
      });
  }
}
