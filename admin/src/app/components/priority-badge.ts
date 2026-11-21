import { Component, input } from '@angular/core';

@Component({
  selector: 'app-priority-badge',
  template: `<span class="pill pill-{{ priority() }}">{{ priority() }}</span>`
})
export class PriorityBadge {
  priority = input.required<string>();
}