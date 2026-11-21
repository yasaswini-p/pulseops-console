import { Pipe, PipeTransform } from '@angular/core';

// Custom pipe: IN_PROGRESS → "In progress"
@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    if (!status) return '';
    return status.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }
}