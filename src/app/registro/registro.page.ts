import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, RegisterResponse } from '../services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RegistroPage {

  nombre: string = '';
  email: string = '';
  password: string = '';
  repPassword: string = '';
  fecha: string = '';

  constructor(private router: Router, private authService: AuthService) { }

  registrarUsuario() {
    // Validaciones básicas
    if (!this.nombre || !this.email || !this.password || !this.repPassword || !this.fecha) {
      alert('Por favor completá todos los campos');
      return;
    }

    if (this.password !== this.repPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    // Llamar al AuthService y tipar la respuesta
    this.authService.register(this.nombre, this.email, this.password, this.fecha)
      .subscribe({
        next: (res: RegisterResponse) => {
          alert(res.message || 'Registro exitoso 🎉');
          this.router.navigate(['/tabs/tab1']);
        },
        error: (err: any) => { // <-- aquí tipamos como any, o ApiError si tu API es consistente
          console.error(err);
          alert(err.error?.error || 'Error en el registro');
        }
      });

  }

  irLogin() {
    this.router.navigate(['/tabs/tab1']); // Navegar a login
  }
}
