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
  activeTab: 'login' | 'register' | 'reset' = 'login';
  
  // Login
  loginEmail = '';
  loginPassword = '';
  
  // Register
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';
  registerRole: 'ORGANIZER' | 'PARTICIPANT' = 'PARTICIPANT';
  
  // Reset Password
  resetEmail = '';
  resetNewPassword = '';
  resetConfirmPassword = '';
  
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  switchTab(tab: 'login' | 'register' | 'reset') {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  
  private getErrorMessage(err: any): string {
    if (err.error) {
      
      if (typeof err.error === 'object' && err.error.message) {
        return err.error.message;
      }
     
      if (typeof err.error === 'string') {
        return err.error;
      }
    }
    return 'Une erreur est survenue';
  }

  private validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      return { valid: false, message: 'Le mot de passe doit contenir au moins une lettre et un chiffre' };
    }

    return { valid: true, message: '' };
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
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(err);
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

    const validation = this.validatePassword(this.registerPassword);
    if (!validation.valid) {
      this.errorMessage = validation.message;
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
        this.successMessage = `Compte créé avec succès ! Bienvenue ${user.name}`;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  resetPassword() {
    if (!this.resetEmail || !this.resetNewPassword || !this.resetConfirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.resetNewPassword !== this.resetConfirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    const validation = this.validatePassword(this.resetNewPassword);
    if (!validation.valid) {
      this.errorMessage = validation.message;
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.resetPassword(this.resetEmail, this.resetNewPassword, this.resetConfirmPassword).subscribe({
      next: (response) => {
        this.isSubmitting = false;
       
        const message = (response && response.message) ? response.message : 'Mot de passe réinitialisé avec succès !';
        this.successMessage = message;
        
        this.resetEmail = '';
        this.resetNewPassword = '';
        this.resetConfirmPassword = '';

        setTimeout(() => {
          this.switchTab('login');
          this.successMessage = 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe';
        }, 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }
}