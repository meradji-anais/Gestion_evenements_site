import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  activeTab: 'login' | 'register' = 'login';
  
  // Login
  loginEmail = '';
  loginPassword = '';
  
  // Register
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';
  registerRole: 'ORGANIZER' | 'PARTICIPANT' = 'PARTICIPANT';
  
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.errorMessage = '';
  }

  login() {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.loginEmail, this.loginPassword).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        // Redirection vers le dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error || 'Email ou mot de passe incorrect';
      }
    });
  }

  register() {
    if (!this.registerEmail || !this.registerPassword || !this.registerConfirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.registerPassword !== this.registerConfirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.register(
      this.registerEmail,
      this.registerPassword,
      this.registerConfirmPassword,
      this.registerRole
    ).subscribe({
      next: (user) => {
        this.isSubmitting = false;
        alert(`Compte créé avec succès ! Bienvenue ${user.name}`);
        // Redirection vers le dashboard 
    this.router.navigate(['/dashboard']);
        
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.error || 'Erreur lors de l\'inscription';
      }
    });
  }
}