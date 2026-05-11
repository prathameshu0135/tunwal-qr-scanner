import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-warranty-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty-records.component.html',
  styleUrl: './warranty-records.component.css'
})
export class WarrantyRecordsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  records = signal<any[]>([]);
  loading = signal(false);
  exporting = signal(false);
  error = signal('');

  search = '';

  ngOnInit(): void {
    this.loadRecords();
  }

  get totalRecords(): number {
    return this.records().length;
  }

  loadRecords(): void {
    this.loading.set(true);
    this.error.set('');

    this.api.getWarrantyRecords(this.search).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.records.set(res.data || []);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to load warranty records.');
      }
    });
  }

  clearSearch(): void {
    this.search = '';
    this.loadRecords();
  }

  openDetail(qrId: string): void {
    this.router.navigate(['/admin/warranty', qrId]);
  }

  exportExcel(): void {
    this.exporting.set(true);
    this.error.set('');

    this.api.downloadWarrantyExcel().subscribe({
      next: (blob) => {
        this.exporting.set(false);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'warranty-records.xlsx';
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.exporting.set(false);
        this.error.set('Excel export failed.');
      }
    });
  }
}