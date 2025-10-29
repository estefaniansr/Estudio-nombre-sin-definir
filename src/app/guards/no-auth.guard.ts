import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase-config';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Promise<boolean> {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          // Usuario ya está logueado, redirigir al home
          this.router.navigate(['/tabs/tab1']);
          resolve(false);
        } else {
          // Usuario no logueado, permitir acceso
          resolve(true);
        }
      });
    });
  }
}