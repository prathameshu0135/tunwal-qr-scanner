import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-warranty-success',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule
  ],
  templateUrl: './warranty-success.component.html',
  styleUrl: './warranty-success.component.css'
})
export class WarrantySuccessComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  qrId = this.route.snapshot.paramMap.get('qrId') || '';

  message = signal('');
  error = signal('');

  goHome(): void {
    this.router.navigate(['/']);
  }
}