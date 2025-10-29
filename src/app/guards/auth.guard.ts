import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase-config';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Promise<boolean> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve(true); // Usuario logueado → permitir acceso
        } else {
          // Redirigir al tab1 (que muestra el formulario de login)
          this.router.navigate(['/tabs/tab1']);
          resolve(false); // Usuario NO logueado → denegar acceso
        }
      });
    });
  }
}