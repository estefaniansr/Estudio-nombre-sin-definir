import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterResponse {
  message: string;
  error?: string;
}

export interface LoginResponse {
  token: string;
  message: string;
  error?: string;
}

export interface ApiError {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private baseUrl = 'http://127.0.0.1:3000/'; // URL de tu backend

  constructor(private http: HttpClient) { }

    /**
   * Método para registrar un nuevo usuario.
   * @param nombre Nombre del usuario
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @param fecha Fecha de registro (puede ser la fecha de nacimiento o la fecha de creación de cuenta)
   * @returns Observable con la respuesta del backend que contiene un mensaje de éxito o error.
   */
  register(nombre: string, email: string, password: string, fecha: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}register`, { nombre, email, password, fecha }, { withCredentials: true });
  }

  /**
   * Método para iniciar sesión con un usuario registrado.
   * @param email Email del usuario
   * @param password Contraseña del usuario
   * @returns Observable con la respuesta que contiene un token de acceso y un mensaje de éxito o error.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}login`, { email, password }, { withCredentials: true });
  }

  /**
   * Método para cerrar sesión del usuario.
   * @returns Observable con la respuesta del backend que confirma que el usuario ha cerrado sesión correctamente.
   */
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}logout`, {}, { withCredentials: true });
  }
}
