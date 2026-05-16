import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-warranty-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warranty-detail.component.html',
  styleUrl: './warranty-detail.component.css'
})
export class WarrantyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  qrId = '';

  data = signal<any | null>(null);
  loading = signal(false);
  saving = signal(false);
  editMode = signal(false);
  error = signal('');
  success = signal('');

  states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Delhi'
  ];

  form = this.fb.group({
    scooterName: ['', Validators.required],
    scooterColor: ['', Validators.required],
    controllerNumber: ['', Validators.required],
    batteryNumber: ['', Validators.required],
    motorNumber: ['', Validators.required],
    chassisNumber: ['', Validators.required],
    chargerNumber: ['', Validators.required],

    dealerName: ['', Validators.required],
    dealerAddress: ['', Validators.required],
    state: ['', Validators.required],
    dateOfSale: ['', Validators.required],

    customerName: ['', Validators.required],
    contactNumber: [
      '',
      [Validators.required, Validators.pattern(/^[0-9]{10}$/)]
    ]
  });

  ngOnInit(): void {
    this.qrId = this.route.snapshot.paramMap.get('qrId') || '';

    if (!this.qrId) {
      this.error.set('QR ID missing');
      return;
    }

    this.loadDetail();
  }

  loadDetail(): void {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.getWarrantyDetail(this.qrId).subscribe({
      next: (res) => {
        this.loading.set(false);

        this.data.set(res.data);

        this.patchForm(res.data);
      },

      error: (err) => {
        this.loading.set(false);

        this.error.set(
          err?.error?.message || 'Failed to load warranty details'
        );
      }
    });
  }

  patchForm(item: any): void {
    this.form.patchValue({
      scooterName: item?.scooterName || '',
      scooterColor: item?.scooterColor || '',
      controllerNumber: item?.controllerNumber || '',
      batteryNumber: item?.batteryNumber || '',
      motorNumber: item?.motorNumber || '',
      chassisNumber: item?.chassisNumber || '',
      chargerNumber: item?.chargerNumber || '',

      dealerName: item?.dealerName || '',
      dealerAddress: item?.dealerAddress || '',
      state: item?.state || '',

      dateOfSale: item?.dateOfSale
        ? String(item.dateOfSale).slice(0, 10)
        : '',

      customerName: item?.customerName || '',
      contactNumber: item?.contactNumber || ''
    });
  }

  enableEdit(): void {
    this.editMode.set(true);

    this.error.set('');
    this.success.set('');
  }

  cancelEdit(): void {
    const item = this.data();

    if (item) {
      this.patchForm(item);
    }

    this.editMode.set(false);

    this.error.set('');
    this.success.set('');
  }

  saveChanges(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      this.error.set('Please fill all required fields correctly');

      return;
    }

    this.saving.set(true);

    this.error.set('');
    this.success.set('');

    this.api
      .updateWarrantyDetail(this.qrId, this.form.getRawValue())
      .subscribe({
        next: (res) => {
          this.saving.set(false);

          this.editMode.set(false);

          this.data.set(res.data);

          this.patchForm(res.data);

          this.success.set(
            res.message || 'Warranty details updated successfully'
          );
        },

        error: (err) => {
          this.saving.set(false);

          this.error.set(
            err?.error?.message || 'Failed to update warranty details'
          );
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/warranty-records']);
  }

  goDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  printPage(): void {
    window.print();
  }
}