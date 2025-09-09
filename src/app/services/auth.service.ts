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

  // Registro de usuario
  register(nombre: string, email: string, password: string, fecha: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}register`, { nombre, email, password, fecha }, { withCredentials: true });
  }

  // Login
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}login`, { email, password }, { withCredentials: true });
  }

  // Logout
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}logout`, {}, { withCredentials: true });
  }
}
