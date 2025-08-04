import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { TrackingService, TrackingInfo } from '../../services/tracking.service';
import { NotificationService } from '../../services/notification.service';
import { TrackingMapComponent, MapLocation } from '../../components/tracking/tracking-map/tracking-map.component';
import { IconComponent } from '../../components/ui/icon/icon';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-track',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconComponent,
    TrackingMapComponent
  ],
  templateUrl: './track.html',
  styleUrls: ['./track.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Track implements OnInit, OnDestroy {
  // Show a message for live tracking if not logged in
  get showLiveTrackingLoginMessage(): boolean {
    return !this.isLoggedIn && !!this.trackingInfo;
  }
  realTimeEnabled = true;
  searchHistory: any[] = [];
  private destroy$ = new Subject<void>();
  trackingNumber = '';
  trackingInfo: TrackingInfo | null = null;
  isLoading = false;
  errorMessage = '';
  validationError = '';
  mapLocations: MapLocation[] = [];
  currentMapLocation?: MapLocation;
  isLoggedIn = false;
  demoTrackingNumber = 'SND1234567890';
  demoTrackingInfo: TrackingInfo | null = null;
  inputFocused = false;
  routePolyline: [number, number][] = [];

  @Input() currentLocation?: MapLocation;
  @Input() lastUpdated?: string;

  constructor(
    private trackingService: TrackingService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.trackingService.tracking$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tracking => {
        this.trackingInfo = tracking;
      });
    this.trackingService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
    this.trackingService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error || '';
      });
    this.isLoggedIn = !!localStorage.getItem('auth_token');
    this.demoTrackingInfo = {
      trackingNumber: this.demoTrackingNumber,
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      actualDelivery: undefined,
      currentLocation: {
        address: 'Kenol',
        city: 'Kenol',
        state: 'Muranga, County',
        country: 'Kenya',
        postalCode: '00100'
      },
      origin: {
        address: 'Chuka University, Chuka',
        city: 'Chuka',
        state: 'Tharaka-Nithi',
        country: 'Kenya',
        postalCode: '60400'
      },
      destination: {
        address: 'Westlands, Nairobi',
        city: 'Nairobi',
        state: 'Nairobi County',
        country: 'Kenya',
        postalCode: '00800'
      },
      events: [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'picked_up',
          location: 'Chuka University',
          description: 'Package picked up in Chuka'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'in_transit',
          location: 'Kenol',
          description: 'In transit through Kenol'
        }
      ],
      serviceType: 'LIGHT',
      weight: 2.5,
      recipient: {
        name: 'Jane Example',
        phone: '0712-123456',
        email: 'jane@example.com'
      },
      sender: {
        name: 'John Example',
        phone: '0722-567890',
        email: 'john@example.com'
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.trackingService.stopRealTimeTracking();
  }

  onSubmit() {
    if (!this.validateTrackingNumber()) {
      return;
    }
    this.errorMessage = '';
    this.validationError = '';
    // Demo logic
    if (this.trackingNumber.trim().toUpperCase() === this.demoTrackingNumber.toUpperCase()) {
      this.trackingInfo = this.demoTrackingInfo as TrackingInfo;
      this.setupMapLocations(this.trackingInfo);

      // Demo route polyline with more points (simulated Google Maps route)
      const fullDemoPolyline = [
        [-0.3346, 37.6359], // Chuka University
        [-0.3500, 37.6200],
        [-0.3700, 37.6000],
        [-0.3900, 37.5800],
        [-0.4100, 37.5600],
        [-0.4300, 37.5400],
        [-0.4500, 37.5200],
        [-0.4700, 37.5000],
        [-0.5000, 37.4800],
        [-0.5300, 37.4600],
        [-0.5600, 37.4400],
        [-0.5900, 37.4200],
        [-0.6200, 37.4000],
        [-0.6500, 37.3800],
        [-0.6800, 37.3600],
        [-0.7100, 37.3400],
        [-0.7400, 37.3200],
        [-0.7700, 37.3000],
        [-0.8000, 37.2000],
        [-0.8500, 37.1800],
        [-0.9000, 37.1500],
        [-0.939239, 37.124696], // Kenol
        [-1.0000, 37.0500],
        [-1.0500, 37.0000],
        [-1.1000, 36.9500],
        [-1.1500, 36.9000],
        [-1.2000, 36.8500],
        [-1.2300, 36.8200],
        [-1.2500, 36.8100],
        [-1.2648, 36.8001] // Westlands
      ];
      // Only show up to current location if not delivered
      let polylineEndIndex = fullDemoPolyline.length - 1;
      if (this.trackingInfo.status !== 'delivered') {
        // Find index of current location (Kenol)
        polylineEndIndex = fullDemoPolyline.findIndex(
          pt => pt[0] === -0.939239 && pt[1] === 37.124696
        );
        if (polylineEndIndex === -1) polylineEndIndex = 21;
      }
      this.routePolyline = fullDemoPolyline.slice(0, polylineEndIndex + 1) as [number, number][];
      const origin: [number, number] = [-0.3346, 37.6359];
      const current: [number, number] = [-0.939239, 37.124696];
      const destination: [number, number] = [-1.2648, 36.8001];

      // Set currentMapLocation for demo
      switch (this.trackingInfo.status) {
        case 'pending':
          this.currentMapLocation = {
            latitude: origin[0],
            longitude: origin[1],
            address: this.trackingInfo.origin.address,
            label: 'Origin',
            type: 'origin'
          };
          break;
        case 'picked_up':
        case 'in_transit':
          this.currentMapLocation = {
            latitude: current[0],
            longitude: current[1],
            address: 'Kenol, Kenya',
            label: 'Current Location',
            type: 'current'
          };
          break;
        case 'delivered':
          this.currentMapLocation = {
            latitude: destination[0],
            longitude: destination[1],
            address: this.trackingInfo.destination.address,
            label: 'Destination',
            type: 'destination'
          };
          break;
        default:
          this.currentMapLocation = {
            latitude: current[0],
            longitude: current[1],
            address: this.trackingInfo.currentLocation.address,
            label: 'Current Location',
            type: 'current'
          };
      }
      this.searchHistory = [
        {
          trackingNumber: this.demoTrackingNumber,
          date: this.demoTrackingInfo!.createdAt,
          status: this.demoTrackingInfo!.status,
          origin: this.demoTrackingInfo!.origin.address,
          destination: this.demoTrackingInfo!.destination.address
        }
      ];
      return;
    }
    // Real backend lookup
    this.isLoading = true;
    this.trackingService.trackParcel(this.trackingNumber.trim(), false)
      .subscribe({
        next: (trackingInfo: TrackingInfo) => {
          this.isLoading = false;
          this.trackingInfo = trackingInfo;
          this.setupMapLocations(trackingInfo);
          this.routePolyline = (trackingInfo as any).routePolyline || [];
          this.errorMessage = '';
        },
        error: () => {
          this.isLoading = false;
          this.trackingInfo = null;
          this.errorMessage = 'Tracking number not found.';
        }
      });
  }

  validateTrackingNumber(): boolean {
    if (!this.trackingNumber.trim()) {
      this.validationError = 'Please enter a tracking number.';
      return false;
    }
    this.validationError = '';
    return true;
  }

  onToggleRealTime(event: any) {
    this.realTimeEnabled = event.detail;
  }

  onClearHistory() {
    this.searchHistory = [];
  }

  onInputChange() {
    if (this.validationError) {
      this.validationError = '';
    }
  }

  onInputFocus() {
    this.inputFocused = true;
  }

  onInputBlur() {
    this.inputFocused = false;
    if (this.trackingNumber.trim()) {
      this.validateTrackingNumber();
    }
  }

  onRefreshTracking() {
    if (this.trackingInfo) {
      // Handle demo data refresh without backend call
      if (this.trackingInfo.trackingNumber.trim().toUpperCase() === this.demoTrackingNumber.toUpperCase()) {
        this.trackingInfo = this.demoTrackingInfo as TrackingInfo;
        this.setupMapLocations(this.trackingInfo);
        this.notificationService.showSuccess('Success', 'Tracking information refreshed');
        return;
      }
      // Otherwise, call backend as normal
      this.trackingService.trackParcel(this.trackingInfo.trackingNumber, false)
        .subscribe({
          next: (trackingInfo: TrackingInfo) => {
            this.trackingInfo = trackingInfo;
            this.setupMapLocations(trackingInfo);
            this.notificationService.showSuccess('Success', 'Tracking information refreshed');
          },
          error: () => {
            this.notificationService.showError('Error', 'Failed to refresh tracking');
          }
        });
    }
  }

  setupMapLocations(trackingInfo: TrackingInfo) {
    // Determine current location based on parcel status
    let currentLocationData = {
      latitude: 0,
      longitude: 0,
      address: 'Loading...'
    };

    if (trackingInfo.trackingNumber === this.demoTrackingNumber) {
      // Demo data with predefined coordinates
      const originCoords = { latitude: -0.3346, longitude: 37.6359 };
      const currentCoords = { latitude: -0.939239, longitude: 37.124696 };
      const destinationCoords = { latitude: -1.2648, longitude: 36.8001 };
      // Demo route polyline with more points (simulated Google Maps route)
      const fullDemoPolyline: [number, number][] = [
        [-0.3346, 37.6359],
        [-0.3500, 37.6200],
        [-0.3700, 37.6000],
        [-0.3900, 37.5800],
        [-0.4100, 37.5600],
        [-0.4300, 37.5400],
        [-0.4500, 37.5200],
        [-0.4700, 37.5000],
        [-0.5000, 37.4800],
        [-0.5300, 37.4600],
        [-0.5600, 37.4400],
        [-0.5900, 37.4200],
        [-0.6200, 37.4000],
        [-0.6500, 37.3800],
        [-0.6800, 37.3600],
        [-0.7100, 37.3400],
        [-0.7400, 37.3200],
        [-0.7700, 37.3000],
        [-0.8000, 37.2000],
        [-0.8500, 37.1800],
        [-0.9000, 37.1500],
        [-0.939239, 37.124696],
        [-1.0000, 37.0500],
        [-1.0500, 37.0000],
        [-1.1000, 36.9500],
        [-1.1500, 36.9000],
        [-1.2000, 36.8500],
        [-1.2300, 36.8200],
        [-1.2500, 36.8100],
        [-1.2648, 36.8001]
      ];
      // Only show up to current location if not delivered
      let polylineEndIndex = fullDemoPolyline.length - 1;
      if (trackingInfo.status !== 'delivered') {
        polylineEndIndex = fullDemoPolyline.findIndex(
          pt => pt[0] === -0.939239 && pt[1] === 37.124696
        );
        if (polylineEndIndex === -1) polylineEndIndex = 21;
      }
      this.routePolyline = fullDemoPolyline.slice(0, polylineEndIndex + 1);
      switch (trackingInfo.status) {
        case 'pending':
          currentLocationData = { ...originCoords, address: trackingInfo.origin.address };
          break;
        case 'picked_up':
        case 'in_transit':
          currentLocationData = { ...currentCoords, address: 'Kenol, Kenya' };
          break;
        case 'delivered':
          currentLocationData = { ...destinationCoords, address: trackingInfo.destination.address };
          break;
        default:
          currentLocationData = { ...currentCoords, address: trackingInfo.currentLocation.address };
      }
      this.mapLocations = [
        {
          latitude: originCoords.latitude,
          longitude: originCoords.longitude,
          address: trackingInfo.origin.address,
          label: 'Origin',
          type: 'origin'
        },
        {
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
          address: currentLocationData.address,
          label: 'Current Location',
          type: 'current'
        },
        {
          latitude: destinationCoords.latitude,
          longitude: destinationCoords.longitude,
          address: trackingInfo.destination.address,
          label: 'Destination',
          type: 'destination'
        }
      ];
    } else {
      // Real backend data
      switch (trackingInfo.status) {
        case 'pending':
          currentLocationData = {
            latitude: trackingInfo.origin.latitude ?? 0,
            longitude: trackingInfo.origin.longitude ?? 0,
            address: trackingInfo.origin.address || 'Origin'
          };
          break;
        case 'delivered':
          currentLocationData = {
            latitude: trackingInfo.destination.latitude ?? 0,
            longitude: trackingInfo.destination.longitude ?? 0,
            address: trackingInfo.destination.address || 'Destination'
          };
          break;
        case 'picked_up':
        case 'in_transit':
        default:
          // For in-transit, use currentLocation from backend or fallback to midpoint
          if (trackingInfo.currentLocation?.latitude && trackingInfo.currentLocation?.longitude) {
            currentLocationData = {
              latitude: trackingInfo.currentLocation.latitude,
              longitude: trackingInfo.currentLocation.longitude,
              address: trackingInfo.currentLocation.address || 'In Transit'
            };
          } else {
            // Calculate midpoint between origin and destination as fallback
            const originLat = trackingInfo.origin.latitude ?? 0;
            const originLng = trackingInfo.origin.longitude ?? 0;
            const destLat = trackingInfo.destination.latitude ?? 0;
            const destLng = trackingInfo.destination.longitude ?? 0;
            
            currentLocationData = {
              latitude: (originLat + destLat) / 2,
              longitude: (originLng + destLng) / 2,
              address: trackingInfo.currentLocation?.address || 'In Transit'
            };
          }
      }
      
      this.mapLocations = [
        {
          latitude: trackingInfo.origin.latitude ?? 0,
          longitude: trackingInfo.origin.longitude ?? 0,
          address: trackingInfo.origin.address,
          label: 'Origin',
          type: 'origin'
        },
        {
          latitude: currentLocationData.latitude,
          longitude: currentLocationData.longitude,
          address: currentLocationData.address,
          label: 'Current Location',
          type: 'current'
        },
        {
          latitude: trackingInfo.destination.latitude ?? 0,
          longitude: trackingInfo.destination.longitude ?? 0,
          address: trackingInfo.destination.address,
          label: 'Destination',
          type: 'destination'
        }
      ];
    }
    
    // Set current location for display
    this.currentMapLocation = this.mapLocations[1];
  }

  clearResults() {
    this.trackingService.clearTracking();
    this.trackingInfo = null;
    this.trackingNumber = '';
    this.errorMessage = '';
    this.validationError = '';
    this.mapLocations = [];
    this.currentMapLocation = undefined;
  }

  formatTrackingNumber(trackingNumber: string): string {
    return this.trackingService.formatTrackingNumber(trackingNumber);
  }

  loadDemoData() {
    this.trackingNumber = this.demoTrackingNumber;
    this.onSubmit();
  }


  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'picked_up': 'Picked Up',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusTexts[status] || status;
  }
}