import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-qr-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './qr-details.component.html',
  styleUrl: './qr-details.component.css'
})
export class QrDetailsComponent implements OnInit {

  private fb = inject(FormBuilder);

  loading = signal(true);
  saving = signal(false);
  actionLoading = signal(false);
  editMode = signal(false);

  error = signal('');
  success = signal('');

  data = signal<any>(null);

  form = this.fb.group({
    status: ['active', Validators.required],
    warrantyStatus: ['pending', Validators.required],
    blockedReason: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.getQrById(id).subscribe({
      next: (res: any) => {
        this.data.set(res);

        this.form.patchValue({
          status: res.qr?.status || 'active',
          warrantyStatus: res.qr?.warrantyStatus || 'pending',
          blockedReason: res.qr?.blockedReason || ''
        });

        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to load QR');
        this.loading.set(false);
      }
    });
  }

  enableEdit(): void {
    this.editMode.set(true);
    this.error.set('');
    this.success.set('');
  }

  cancelEdit(): void {
    this.editMode.set(false);

    const qr = this.data()?.qr;

    if (qr) {
      this.form.patchValue({
        status: qr.status,
        warrantyStatus: qr.warrantyStatus,
        blockedReason: qr.blockedReason
      });
    }
  }

  saveChanges(): void {
    const qr = this.data()?.qr;

    if (!qr?._id) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    this.api.updateQrDetails(qr._id, this.form.getRawValue()).subscribe({
      next: (res: any) => {
        this.success.set(res.message || 'QR updated successfully');
        this.saving.set(false);
        this.editMode.set(false);
        this.load();
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Update failed');
        this.saving.set(false);
      }
    });
  }

  blockQr(): void {
    const qr = this.data()?.qr;

    if (!qr?._id) {
      return;
    }

    const reason = prompt('Enter block reason');

    if (!reason?.trim()) {
      return;
    }

    this.actionLoading.set(true);

    this.api.blockQr(qr._id, reason.trim()).subscribe({
      next: (res: any) => {
        this.success.set(res.message || 'QR blocked');
        this.actionLoading.set(false);
        this.load();
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to block QR');
        this.actionLoading.set(false);
      }
    });
  }

  unblockQr(): void {
    const qr = this.data()?.qr;

    if (!qr?._id) {
      return;
    }

    this.actionLoading.set(true);

    this.api.unblockQr(qr._id).subscribe({
      next: (res: any) => {
        this.success.set(res.message || 'QR unblocked');
        this.actionLoading.set(false);
        this.load();
      },
      error: (err: any) => {
        this.error.set(err?.error?.message || 'Failed to unblock QR');
        this.actionLoading.set(false);
      }
    });
  }

  getStatusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'status-active';

      case 'blocked':
        return 'status-blocked';

      case 'inactive':
        return 'status-inactive';

      default:
        return 'status-default';
    }
  }

  getWarrantyClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'registered':
        return 'status-active';

      case 'pending':
        return 'status-pending';

      default:
        return 'status-default';
    }
  }
}