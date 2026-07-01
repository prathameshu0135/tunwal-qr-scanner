import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-warranty-success',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './warranty-success.component.html',
  styleUrl: './warranty-success.component.css'
})
export class WarrantySuccessComponent {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  qrId = this.route.snapshot.paramMap.get('qrId') ?? '';

  registerAnother(): void {
    this.router.navigate(['/']);
  }

  viewWarranty(): void {
    this.router.navigate(['/warranty', this.qrId]);
  }

}