import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as string;

  const user = authService.currentUserValue;
  
  if (!user) {
    console.warn(' Accès refusé : utilisateur non trouvé');
    router.navigate(['/auth']);
    return false;
  }
  
  if (user.role === requiredRole) {
    return true;
  }

  console.warn(` Accès refusé : rôle requis=${requiredRole}, rôle actuel=${user.role}`);
  router.navigate(['/dashboard']);
  return false;
};