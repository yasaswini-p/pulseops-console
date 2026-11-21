import { Component, computed, inject, input } from '@angular/core';
import { ClockService } from '../services/clock.service';
import { formatRemaining } from '../utils/format';

@Component({
  selector: 'app-sla-countdown',
  template: `<span [class.text-danger]="state().breached" [class.text-good]="!state().breached">{{ state().text }}</span>`
})
export class SlaCountdown {
  dueAt = input.required<string>();
  resolvedAt = input<string | null | undefined>(null);
  private clock = inject(ClockService);

  // Recomputes every second because it reads the clock signal
  state = computed(() => {
    const resolved = this.resolvedAt();
    if (resolved) {
      const met = new Date(resolved) <= new Date(this.dueAt());
      return { text: met ? 'SLA met' : 'SLA missed', breached: !met };
    }
    return formatRemaining(this.dueAt(), this.clock.now());
  });
}