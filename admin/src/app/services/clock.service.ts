import { Injectable, signal } from '@angular/core';

// One shared clock that ticks every second, used by all SLA countdowns
@Injectable({ providedIn: 'root' })
export class ClockService {
  readonly now = signal(Date.now());

  constructor() {
    setInterval(() => this.now.set(Date.now()), 1000);
  }
}