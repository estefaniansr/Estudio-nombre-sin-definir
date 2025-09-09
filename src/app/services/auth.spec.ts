import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service'; // 🔹 importar el nombre correcto

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService], // 🔹 declarar el servicio aquí
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
