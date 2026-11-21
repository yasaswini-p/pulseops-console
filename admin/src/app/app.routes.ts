import { Routes } from '@angular/router';
import { LoginPage } from './pages/login-page';
import { QueuePage } from './pages/queue-page';
import { IncidentDetailPage } from './pages/incident-detail-page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'incidents', component: QueuePage, canActivate: [authGuard] },
  { path: 'incidents/:id', component: IncidentDetailPage, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'incidents' },
  { path: '**', redirectTo: 'incidents' }
];