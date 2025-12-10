import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['role'] as string;

  
  return authService.currentUser$.pipe(
    filter(user => user !== undefined),  
    take(1),  
    map(user => {
      if (!user) {
        console.warn(' Accès refusé : utilisateur non trouvé');
        router.navigate(['/auth']);
        return false;
      }
      
      if (user.role === requiredRole) {
        console.log(` Accès autorisé pour ${user.name} (${user.role})`);
        return true;
      }

      console.warn(` Accès refusé : rôle requis=${requiredRole}, rôle actuel=${user.role}`);
      router.navigate(['/dashboard']);
      return false;
    })
  );
};