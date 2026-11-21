import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Incident, IncidentFilters, NewIncident, WorkNote } from '../models';

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private http = inject(HttpClient);
  private base = '/api/incidents';

  list(filters: IncidentFilters) {
    let params = new HttpParams().set('sort', 'sla').set('limit', '100');
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.team) params = params.set('team', filters.team);
    if (filters.mine) params = params.set('assignee', 'me');
    return this.http.get<{ count: number; incidents: Incident[] }>(this.base, { params });
  }

  get(id: string) {
    return this.http.get<Incident>(`${this.base}/${id}`);
  }

  create(data: NewIncident) {
    return this.http.post<Incident>(this.base, data);
  }

  assign(id: string) {
    return this.http.post<Incident>(`${this.base}/${id}/assign`, {});
  }

  resolve(id: string, resolution: string) {
    return this.http.post<Incident>(`${this.base}/${id}/resolve`, { resolution });
  }

  addNote(id: string, text: string) {
    return this.http.post<WorkNote>(`${this.base}/${id}/notes`, { text });
  }
}