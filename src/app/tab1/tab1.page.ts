import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page {

  constructor(private router: Router) {}

  iniciarSesion(usuario: string, password: string) {
  console.log('Usuario:', usuario);
  console.log('Password:', password);
 // Navega directamente al Tab2
    this.router.navigate(['/tabs/tab2']);
  // Aquí podés validar y navegar
  if (!usuario || !password) {
    alert('Completa todos los campos');
    return;
  }

  this.router.navigate(['/tabs/tab2']); // redirige a Inicio
}
  irRegistro() {
    this.router.navigate(['/registro']); // Página de registro fuera de tabs
  }
}


 