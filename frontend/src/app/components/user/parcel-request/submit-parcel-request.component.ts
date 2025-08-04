import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParcelRequestService, ParcelRequestData } from '../../../services/parcel-request.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-submit-parcel-request',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  standalone: true,
  templateUrl: './submit-parcel-request.component.html',
  styleUrls: ['./submit-parcel-request.component.scss']
})
export class SubmitParcelRequestComponent {
  @Output() requestSubmitted = new EventEmitter<void>();
  requestForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private fb: FormBuilder,
    private parcelRequestService: ParcelRequestService
  ) {
    this.requestForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      receiverName: ['', Validators.required],
      receiverPhone: [''],
      description: ['', Validators.required],
      weight: [null, [Validators.required, Validators.min(0.1)]],
      pickupLocation: ['', Validators.required],
      destinationLocation: ['', Validators.required],
      requestedPickupDate: [''],
      specialInstructions: ['']
    });
  }

  submitRequest() {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = null;
    this.success = null;
    const data: ParcelRequestData = this.requestForm.value;
    this.parcelRequestService.submitParcelRequest(data).subscribe({
      next: () => {
        this.success = 'Parcel request submitted!';
        this.loading = false;
        this.requestSubmitted.emit();
        this.requestForm.reset();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to submit request.';
        this.loading = false;
      }
    });
  }
}
