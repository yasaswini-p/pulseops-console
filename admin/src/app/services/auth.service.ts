import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { Session } from '../models';

const STORAGE_KEY = 'pulseops.operator.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals: any template reading these updates automatically when they change
  readonly session = signal<Session | null>(this.restore());
  readonly user = computed(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  login(username: string, password: string): Observable<Session> {
    return this.http.post<Session>('/api/auth/login', { username, password }).pipe(
      map(session => {
        if (session.user.role !== 'operator') {
          throw new Error('This console is for operators. Managers should use the Manager Dashboard.');
        }
        return session;
      }),
      tap(session => {
        this.session.set(session);
        this.persist(session);
      })
    );
  }

  logout(): void {
    this.session.set(null);
    this.persist(null);
    this.router.navigate(['/login']);
  }

  token(): string | null {
    return this.session()?.token ?? null;
  }

  private restore(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  }

  private persist(session: Session | null): void {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }
}