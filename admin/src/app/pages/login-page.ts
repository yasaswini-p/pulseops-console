import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { errorMessage } from '../utils/format';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.html'
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';
  error = signal<string | null>(null);
  loading = signal(false);

  submit(): void {
    this.error.set(null);
    this.loading.set(true);
    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => this.router.navigate(['/incidents']),
      error: err => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      }
    });
  }
}