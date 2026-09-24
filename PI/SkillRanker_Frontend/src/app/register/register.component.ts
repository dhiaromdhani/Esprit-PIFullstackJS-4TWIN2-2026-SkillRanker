import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
 firstName = '';
  lastName = '';
  email = '';
  department = '';
  role = '';
  password = '';
  confirmPassword = '';
  error = '';

  private API = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register() {
    // Validation
    if (!this.firstName || !this.lastName || !this.email || !this.role || !this.password) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    const userData = {
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      role: this.role,
      department: this.department
    };

    this.http.post(`${this.API}/register`, userData)
      .subscribe({
        next: (response: any) => {
          console.log('Registration successful:', response);
          // Redirect to login page
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Registration error:', err);
          if (err.status === 400) {
            this.error = 'Cet email est déjà utilisé';
          } else {
            this.error = 'Une erreur est survenue. Veuillez réessayer.';
          }
        }
      });
  }

  registerWithGoogle() {
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'https://chowder-snooze-mutt.ngrok-free.dev/api/auth/google';
  }
}
