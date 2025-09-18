import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class Tab1Page {

  constructor(private router: Router, private http: HttpClient) { }

  iniciarSesion(usuario: string, password: string) {
    if (!usuario || !password) {
      alert('Completa todos los campos');
      return;
    }

    this.http.post('http://127.0.0.1:3000/login', { email: usuario, password }, { withCredentials: true })
      .subscribe({
        next: (res: any) => {
          console.log('Login exitoso:', res);
          // Redirigir a tabs (TabsPage) después del login
          this.router.navigate(['/tabs/tab2']);
        },
        error: (err) => {
          console.error('Error login:', err);
          alert(err.error?.error || 'Error al conectarse al servidor');
        }
      });
  }

  irRegistro() {
    this.router.navigate(['/registro']); // Página de registro fuera de tabs
  }
}
