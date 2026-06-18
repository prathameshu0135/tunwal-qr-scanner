import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './activate.component.html',
  styleUrl: './activate.component.css'
})
export class ActivateComponent implements OnInit {
  qrId = '';

  loading = signal(true);
  error = signal('');

  status = signal('');
  warrantyStatus = signal('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';

    if (!this.qrId) {
      this.error.set('Invalid QR ID');
      this.loading.set(false);
      return;
    }

    this.api.getQrStatus(this.qrId).subscribe({
      next: (res) => {
        const data = res.data || res;

        this.status.set(data.status || '');
        this.warrantyStatus.set(data.warrantyStatus || 'pending');

        if (data.status === 'blocked') {
          this.router.navigate(['/blocked', this.qrId]);
          return;
        }

        if (data.status === 'expired' || data.status === 'scrapped') {
          this.error.set(`This QR is ${data.status}. Please contact support.`);
          this.loading.set(false);
          return;
        }

        if (data.warrantyStatus === 'registered') {
          this.router.navigate(['/warranty-success', this.qrId]);
          return;
        }

        this.router.navigate(['/register', this.qrId]);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message || 'Failed to load QR details.'
        );
        this.loading.set(false);
      }
    });
  }
}