import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ParcelRequestService, ParcelRequestData } from '../../../services/parcel-request.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-send-parcel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './send-parcel.html',
  styleUrls: [],
})
export class SendParcelComponent {
  @Output() parcelSent = new EventEmitter<void>();
  parcelForm: FormGroup;
  isLoading = false;
  success = false;
  error = '';
  sentParcel: import('../../../services/parcel-request.service').ParcelRequest | null = null;

  constructor(
    private fb: FormBuilder,
    private parcelRequestService: ParcelRequestService,
    private notificationService: NotificationService
  ) {
    this.parcelForm = this.fb.group({
      receiverEmail: ['', [Validators.required, Validators.email]],
      receiverName: ['', [Validators.required, Validators.minLength(2)]],
      receiverPhone: [''],
      description: ['', [Validators.required, Validators.minLength(5)]],
      weight: [null, [Validators.required, Validators.min(0.1)]],
      pickupLocation: ['', [Validators.required, Validators.minLength(3)]],
      destinationLocation: ['', [Validators.required, Validators.minLength(3)]],
      requestedPickupDate: [''],
      specialInstructions: ['']
    });
  }

  submitParcel() {
    if (this.parcelForm.invalid) {
      this.parcelForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.error = '';
    this.success = false;
    // Remove empty string optional fields
    const rawData: ParcelRequestData = this.parcelForm.value;
    const data: ParcelRequestData = { ...rawData };
    if (data.receiverPhone === '') delete data.receiverPhone;
    if (data.requestedPickupDate === '') delete data.requestedPickupDate;
    if (data.specialInstructions === '') delete data.specialInstructions;
    this.parcelRequestService.submitParcelRequest(data).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.success = true;
        this.sentParcel = res;
        this.parcelSent.emit();
        this.parcelForm.reset();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || 'Failed to submit parcel request';
        this.notificationService.showError('Error', this.error);
      }
    });
  }
}