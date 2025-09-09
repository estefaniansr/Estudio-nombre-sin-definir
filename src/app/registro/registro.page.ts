import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // necesario para ion-header, ion-input, etc.
import { CommonModule } from '@angular/common'; // necesario para *ngIf, *ngFor
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule] // FormsModule no hace falta si no usás ngModel
})
export class RegistroPage {

  constructor(private router: Router) {}

  redirigirATab1() {
    this.router.navigate(['/tab1']); // Navega a la ruta 'ta1'
  }

  registrarUsuario(nombre: string, email: string, password: string, repPassword: string, fecha: string) {
    console.log('Intentando registrar usuario...');
    
    // validaciones básicas
    if (!nombre || !email || !password || !repPassword || !fecha) {
      console.log('Por favor, completa todos los campos');
      return;
    }
    
    if (password !== repPassword) {
      console.log('Las contraseñas no coinciden');
      return;
    }
    
    // simulación de registro exitoso
    console.log('Usuario registrado exitosamente:', {
      nombre,
      email,
      fechaNacimiento: fecha
    });
    
    // Redirige al login después del registro
    this.router.navigate(['/login']);
  }

}