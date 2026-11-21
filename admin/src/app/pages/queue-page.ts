import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { IncidentService } from '../services/incident.service';
import { ClockService } from '../services/clock.service';
import { PriorityBadge } from '../components/priority-badge';
import { SlaCountdown } from '../components/sla-countdown';
import { StatusLabelPipe } from '../pipes/status-label.pipe';
import { Incident, IncidentFilters, NewIncident, PRIORITIES, TEAMS, Team } from '../models';
import { errorMessage } from '../utils/format';

@Component({
  selector: 'app-queue-page',
  imports: [FormsModule, RouterLink, PriorityBadge, SlaCountdown, StatusLabelPipe],
  templateUrl: './queue-page.html'
})
export class QueuePage {
  readonly auth = inject(AuthService);
  private api = inject(IncidentService);
  private clock = inject(ClockService);

  readonly priorities = PRIORITIES;
  readonly teams = TEAMS;

  filters: IncidentFilters = { status: 'active', priority: '', team: '', mine: false };
  draft: NewIncident = this.emptyDraft();

  incidents = signal<Incident[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  showCreate = signal(false);

  // Derived values recalculate automatically when incidents or the clock change
  readonly counts = computed(() => {
    const list = this.incidents();
    const me = this.auth.user()?.sub;
    const now = this.clock.now();
    return {
      total: list.length,
      breached: list.filter(i => i.status !== 'RESOLVED' && new Date(i.slaDueAt).getTime() < now).length,
      mine: list.filter(i => i.assignee === me).length
    };
  });

  constructor() {
    this.load();
    const id = setInterval(() => this.load(false), 15000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  load(showSpinner = true): void {
    if (showSpinner) this.loading.set(true);
    this.api.list(this.filters).subscribe({
      next: res => {
        this.incidents.set(res.incidents);
        this.error.set(null);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }

  take(incident: Incident, event: Event): void {
    event.stopPropagation();   // don't open the detail page when clicking the button
    this.api.assign(incident.incidentId).subscribe({
      next: () => {
        this.flash(`${incident.incidentId} is now assigned to you`);
        this.load(false);
      },
      error: err => this.error.set(errorMessage(err))
    });
  }

  create(): void {
    this.api.create(this.draft).subscribe({
      next: created => {
        this.flash(`${created.incidentId} created — SLA due ${new Date(created.slaDueAt).toLocaleTimeString()}`);
        this.draft = this.emptyDraft();
        this.showCreate.set(false);
        this.load(false);
      },
      error: err => this.error.set(errorMessage(err))
    });
  }

  private flash(text: string): void {
    this.message.set(text);
    setTimeout(() => this.message.set(null), 4000);
  }

  private emptyDraft(): NewIncident {
    return { title: '', priority: 'P3', team: (this.auth.user()?.team ?? 'APP') as Team, description: '' };
  }
}