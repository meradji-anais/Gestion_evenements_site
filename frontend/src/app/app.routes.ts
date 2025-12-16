import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthComponent } from './auth/auth.component';
import { OrganizerDashboardComponent } from './organizer/organizer-dashboard.component';
import { ParticipantDashboardComponent } from './participant/participant-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { guestGuard } from './guards/guest.guard'; 

export const routes: Routes = [
  // Routes publiques (accessibles par tous)
  { 
    path: '', 
    component: HomeComponent 
  },
  { 
    path: 'home', 
    component: HomeComponent 
  },
  
  
  { 
    path: 'auth', 
    component: AuthComponent,
    canActivate: [guestGuard] 
  },
  
  
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'organizer', 
    component: OrganizerDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ORGANIZER' }
  },
  { 
    path: 'participant', 
    component: ParticipantDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'PARTICIPANT' }
  },
  
  // Fallback
  { 
    path: '**', 
    redirectTo: 'home'  
  }
];