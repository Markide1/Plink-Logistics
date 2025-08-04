import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcelService, Parcel } from '../../../services/parcel.service';
import { Subscription, Subject, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, timeout, map, tap, catchError } from 'rxjs/operators';
import { TrackingMapComponent } from '../../tracking/tracking-map/tracking-map.component';
import { MapLocation, User, getUserName } from '../../../models/types';

@Component({
  selector: 'app-admin-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, TrackingMapComponent],
  templateUrl: './user-tracking.html',
  styleUrls: ['./user-tracking.scss']
})
export class UserTrackingComponent implements OnInit, OnDestroy {
  trackingNumber: string = '';
  trackedParcel: Parcel | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  mapLocations: MapLocation[] = [];
  currentLocation?: MapLocation;
  lastUpdated?: string;
  routePolyline: [number, number][] = []; // Add this property

  private trackingNumberChanged$ = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private parcelService: ParcelService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const trackingSub = this.trackingNumberChanged$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(trackingNumber => {
          if (trackingNumber && trackingNumber.trim().length > 3) {
            return this.performTracking(trackingNumber.trim());
          }
          this.clearDataOnEmptyTrackingNumber();
          return [];
        })
      )
      .subscribe();

    this.subscriptions.add(trackingSub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onTrackingNumberChange() {
    this.errorMessage = '';
    this.trackingNumberChanged$.next(this.trackingNumber);
  }

  trackParcel() {
    if (!this.trackingNumber.trim()) {
      this.errorMessage = 'Please enter a tracking number';
      this.cdr.detectChanges();
      return;
    }

    const sub = this.performTracking(this.trackingNumber.trim()).subscribe();
    this.subscriptions.add(sub);
  }

  private performTracking(trackingNumber: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.trackedParcel = null;
    this.clearMapData();
    this.cdr.detectChanges();

    return this.parcelService.trackParcel(trackingNumber).pipe(
      timeout(10000),
      map((response: any) => {
        return response?.data ? response.data : response;
      }),
      tap((parcel: Parcel) => {
        this.trackedParcel = parcel;
        this.setupMapLocations(parcel);
        this.routePolyline = parcel.routePolyline || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }),
      catchError((err: any) => {
        this.errorMessage = err?.error?.message || 'Tracking failed. Please check your number.';
        this.isLoading = false;
        this.trackedParcel = null;
        this.clearMapData();
        this.cdr.detectChanges();
        return throwError(() => err);
      })
    );
  }

  private clearDataOnEmptyTrackingNumber() {
    if (!this.trackingNumber.trim()) {
      this.trackedParcel = null;
      this.errorMessage = '';
      this.clearMapData();
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private clearMapData() {
    this.mapLocations = [];
    this.currentLocation = undefined;
    this.lastUpdated = undefined;
  }

  setupMapLocations(parcel: Parcel) {
    const newLocations: MapLocation[] = [];

    if (parcel.pickupLatitude !== undefined && parcel.pickupLongitude !== undefined) {
      newLocations.push({
        latitude: Number(parcel.pickupLatitude),
        longitude: Number(parcel.pickupLongitude),
        address: parcel.pickupLocation || 'Pickup Location',
        label: 'Origin',
        type: 'origin'
      });
    }

    if (parcel.currentLatitude !== undefined && parcel.currentLongitude !== undefined) {
        this.currentLocation = {
            latitude: Number(parcel.currentLatitude),
            longitude: Number(parcel.currentLongitude),
            address: parcel.currentLocation || 'Current Location',
            label: 'Current',
            type: 'current'
        };
        newLocations.push(this.currentLocation);
    } else {
        this.currentLocation = undefined;
    }

    if (parcel.destinationLatitude !== undefined && parcel.destinationLongitude !== undefined) {
      newLocations.push({
        latitude: Number(parcel.destinationLatitude),
        longitude: Number(parcel.destinationLongitude),
        address: parcel.destinationLocation || 'Delivery Location',
        label: 'Destination',
        type: 'destination'
      });
    }

    this.mapLocations = [...newLocations];
    this.lastUpdated = parcel.updatedAt;
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PICKED_UP': 'bg-blue-100 text-blue-800',
      'IN_TRANSIT': 'bg-indigo-100 text-indigo-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'PENDING': 'Pending',
      'PICKED_UP': 'Picked Up',
      'IN_TRANSIT': 'In Transit',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled'
    };
    return statusTexts[status] || status;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  getSenderName(user?: User): string {
    return user ? getUserName(user) : 'User';
  }

  getReceiverName(user?: User): string {
    return user ? getUserName(user) : 'User';
  }
}