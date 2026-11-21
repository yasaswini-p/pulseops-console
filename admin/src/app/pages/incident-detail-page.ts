import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { IncidentService } from '../services/incident.service';
import { PriorityBadge } from '../components/priority-badge';
import { SlaCountdown } from '../components/sla-countdown';
import { StatusLabelPipe } from '../pipes/status-label.pipe';
import { Incident } from '../models';
import { errorMessage } from '../utils/format';

@Component({
  selector: 'app-incident-detail-page',
  imports: [FormsModule, RouterLink, DatePipe, PriorityBadge, SlaCountdown, StatusLabelPipe],
  templateUrl: './incident-detail-page.html'
})
export class IncidentDetailPage {
  private route = inject(ActivatedRoute);
  private api = inject(IncidentService);
  readonly auth = inject(AuthService);

  private id = this.route.snapshot.paramMap.get('id') ?? '';

  incident = signal<Incident | null>(null);
  error = signal<string | null>(null);
  busy = signal(false);
  noteText = '';
  resolution = '';

  readonly isMine = computed(() => this.incident()?.assignee === this.auth.user()?.sub);
  readonly canResolve = computed(() => {
    const i = this.incident();
    return !!i && (i.status === 'OPEN' || (i.status === 'IN_PROGRESS' && this.isMine()));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.get(this.id).subscribe({
      next: incident => this.incident.set(incident),
      error: err => this.error.set(errorMessage(err))
    });
  }

  take(): void {
    this.run(this.api.assign(this.id));
  }

  addNote(): void {
    this.run(this.api.addNote(this.id, this.noteText.trim()), () => (this.noteText = ''));
  }

  resolve(): void {
    this.run(this.api.resolve(this.id, this.resolution.trim()), () => (this.resolution = ''));
  }

  // Shared handling for every action: show busy state, reload on success, show errors
  private run(request: Observable<unknown>, onSuccess?: () => void): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        onSuccess?.();
        this.busy.set(false);
        this.load();
      },
      error: err => {
        this.error.set(errorMessage(err));
        this.busy.set(false);
      }
    });
  }
}