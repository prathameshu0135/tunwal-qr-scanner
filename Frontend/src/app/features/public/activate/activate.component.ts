import { Component, OnInit, signal } from '@angular/core';
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

      next: (res: any) => {

        const data = res.data || res;

        // QR blocked
        if (data.status === 'blocked') {
          this.router.navigate(['/blocked', this.qrId]);
          return;
        }

        // Warranty already completed
        if (data.warrantyStatus === 'registered') {
          this.router.navigate(['/warranty-success', this.qrId]);
          return;
        }

        // Warranty pending
        this.router.navigate(['/warranty', this.qrId]);

      },

      error: (err: any) => {
        this.error.set(
          err?.error?.message || 'Unable to load QR details.'
        );
        this.loading.set(false);
      }

    });

  }

}