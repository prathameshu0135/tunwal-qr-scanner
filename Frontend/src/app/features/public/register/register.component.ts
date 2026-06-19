import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);

  qrId = '';

  loading = signal(false);
  loadingWarranty = signal(true);
  error = signal('');
  success = signal('');

  form = this.fb.group({
    customerName: [{ value: '', disabled: true }, [Validators.required]],
    mobileNumber: [{ value: '', disabled: true }, [Validators.required]],

    vehicleName: [{ value: '', disabled: true }, [Validators.required]],
    chassisNumber: [{ value: '', disabled: true }, [Validators.required]],
    motorNumber: [{ value: '', disabled: true }, [Validators.required]],
    showroomName: [{ value: '', disabled: true }, [Validators.required]]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';

    if (!this.qrId) {
      this.error.set('QR ID missing.');
      this.loadingWarranty.set(false);
      return;
    }

    this.loadWarrantyBasic();
  }

  loadWarrantyBasic(): void {
    this.loadingWarranty.set(true);

    this.api.getWarrantyBasic(this.qrId).subscribe({
      next: (res) => {
        const data = res.data;

        this.form.patchValue({
          customerName: data.customerName || '',
          mobileNumber: data.mobileNumber || '',
          vehicleName: data.vehicleName || '',
          chassisNumber: data.chassisNumber || '',
          motorNumber: data.motorNumber || '',
          showroomName: data.showroomName || ''
        });

        this.loadingWarranty.set(false);
      },
      error: (err) => {
        this.loadingWarranty.set(false);
        this.error.set(
          err?.error?.message || 'Failed to load warranty details.'
        );
      }
    });
  }

  submit(): void {
  this.loading.set(true);
  this.error.set('');
  this.success.set('');

  const raw = this.form.getRawValue();

  const payload = {
    qrId: this.qrId,
    customerName: raw.customerName,
    mobileNumber: raw.mobileNumber,
    vehicleName: raw.vehicleName,
    chassisNumber: raw.chassisNumber,
    motorNumber: raw.motorNumber,
    showroomName: raw.showroomName
  };

  this.api.registerWarranty(payload).subscribe({
    next: () => {
      this.loading.set(false);
      this.success.set('Warranty registered successfully.');

      setTimeout(() => {
        this.router.navigate([
          '/warranty-success',
          this.qrId
        ]);
      }, 1000);
    },
    error: (err) => {
      this.loading.set(false);
      this.error.set(
        err?.error?.message || 'Warranty registration failed.'
      );
    }
  });

  }
}