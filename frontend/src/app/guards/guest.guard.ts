import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';


export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  
  if (!isPlatformBrowser(platformId)) {
    console.log(' GuestGuard SSR : Autorisation temporaire');
    return true;
  }

  
  return authService.currentUser$.pipe(
    filter(user => user !== undefined), 
    take(1),
    map(user => {
      if (user) {
        //  Utilisateur connecté = Bloquer l'accès à /auth
        console.warn(' Accès refusé à /auth : déjà connecté');
        router.navigate(['/dashboard']);
        return false;
      }
      
      //  Pas connecté = Autoriser l'accès
      console.log(' Accès autorisé à /auth : non connecté');
      return true;
    })
  );
};