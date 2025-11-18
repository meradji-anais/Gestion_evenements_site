import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { OrganizerDashboardComponent } from './organizer/organizer-dashboard.component';
import { ParticipantDashboardComponent } from './participant/participant-dashboard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'organizer', component: OrganizerDashboardComponent },
  { path: 'participant', component: ParticipantDashboardComponent },
  { path: '**', redirectTo: '' }
];
