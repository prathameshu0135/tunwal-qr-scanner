import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  loading = signal(true);
  error = signal('');

  dashboard = signal<any>(null);

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {

    this.loading.set(true);
    this.error.set('');

    this.api.getDashboard().subscribe({

      next: (res: any) => {

        this.dashboard.set(res);

        this.loading.set(false);

      },

      error: (err) => {

        this.loading.set(false);

        this.error.set(
          err?.error?.message ||
          'Unable to load dashboard.'
        );

      }

    });

  }

  refresh() {
    this.loadDashboard();
  }

  logout() {

    this.auth.logout();

    this.router.navigate(['/admin/login']);

  }

  warrantyPercent = computed(() => {

    const d = this.dashboard();

    if (!d) return 0;

    if (d.totalQrs === 0) return 0;

    return Math.round(
      (d.warrantyRegistered / d.totalQrs) * 100
    );

  });

  activePercent = computed(() => {

    const d = this.dashboard();

    if (!d) return 0;

    if (d.totalQrs === 0) return 0;

    return Math.round(
      (d.activeQrs / d.totalQrs) * 100
    );

  });

}