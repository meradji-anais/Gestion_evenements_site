import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  
  if (!isPlatformBrowser(platformId)) {
    console.log(' Guard SSR : Autorisation temporaire (vérification côté client)');
    return true;
  }


  return authService.currentUser$.pipe(
    filter(user => user !== undefined), 
    take(1),
    map(user => {
      if (user) {
        console.log(' Utilisateur connecté:', user.name);
        return true;
      }
      
      console.warn(' Accès refusé : non connecté');
      router.navigate(['/auth']);
      return false;
    })
  );
};