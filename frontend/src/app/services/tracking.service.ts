import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, takeUntil, Subject } from 'rxjs';
import { catchError, map, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiService, ApiResponse } from './api.service';

export interface TrackingEvent {
  id: string;
  timestamp: string;
  status: TrackingStatus;
  location: string;
  description: string;
  details?: string;
}

export interface TrackingLocation {
  latitude?: number;
  longitude?: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: TrackingStatus;
  estimatedDelivery: string;
  actualDelivery?: string;
  currentLocation: TrackingLocation;
  origin: TrackingLocation;
  destination: TrackingLocation;
  events: TrackingEvent[];
  serviceType: 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY';
  weight: number;

  recipient: {
    name: string;
    phone?: string;
    email?: string;
  };
  sender: {
    name: string;
    phone?: string;
    email?: string;
  };
  createdAt: string;
  lastUpdated: string;
}

export type TrackingStatus = 
  | 'pending'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface TrackingSearchHistory {
  trackingNumber: string;
  searchedAt: string;
  status: TrackingStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private readonly baseUrl = environment.apiUrl || 'http://localhost:3000/api/v1';
  private trackingSubject = new BehaviorSubject<TrackingInfo | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private stopPolling$ = new Subject<void>();
  
  private readonly POLLING_INTERVAL = 30000; // 30 seconds
  private readonly CACHE_DURATION = 300000; // 5 minutes
  private trackingCache = new Map<string, { data: TrackingInfo; timestamp: number }>();

  public tracking$ = this.trackingSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Track a parcel by tracking number
   */
  trackParcel(trackingNumber: string, enableRealTime: boolean = false): Observable<TrackingInfo> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    this.stopPolling$.next(); // Stop any existing polling

    // Check cache first
    const cached = this.trackingCache.get(trackingNumber);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      this.trackingSubject.next(cached.data);
      this.loadingSubject.next(false);
      
      if (enableRealTime) {
        this.startRealTimeTracking(trackingNumber);
      }
      
      return new Observable(observer => {
        observer.next(cached.data);
        observer.complete();
      });
    }

    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/parcels/track/${trackingNumber}`).pipe(
      map(response => {
        if (response.success && response.data) {
          const trackingInfo = this.mapParcelToTrackingInfo(response.data);
          this.trackingCache.set(trackingNumber, { 
            data: trackingInfo, 
            timestamp: Date.now() 
          });
          this.trackingSubject.next(trackingInfo);
          this.addToSearchHistory(trackingNumber, trackingInfo.status);
          
          if (enableRealTime) {
            this.startRealTimeTracking(trackingNumber);
          }
          
          return trackingInfo;
        }
        throw new Error(response.message || 'Failed to track parcel');
      }),
      catchError(error => {
        const errorMessage = error.message || 'Failed to track parcel';
        this.errorSubject.next(errorMessage);
        throw error;
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Start real-time tracking with polling
   */
  private startRealTimeTracking(trackingNumber: string): void {
    interval(this.POLLING_INTERVAL).pipe(
      switchMap(() => this.apiService.trackParcel(trackingNumber)),
      takeUntil(this.stopPolling$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const trackingInfo = this.mapParcelToTrackingInfo(response.data);
          this.trackingCache.set(trackingNumber, { 
            data: trackingInfo, 
            timestamp: Date.now() 
          });
          this.trackingSubject.next(trackingInfo);
        }
      },
      error: (error) => {
        console.error('Real-time tracking error:', error);
        // Continue polling even if there's an error
      }
    });
  }

  /**
   * Stop real-time tracking
   */
  stopRealTimeTracking(): void {
    this.stopPolling$.next();
  }

  /**
   * Clear current tracking data
   */
  clearTracking(): void {
    this.trackingSubject.next(null);
    this.errorSubject.next(null);
    this.stopPolling$.next();
  }

  /**
   * Get tracking search history
   */
  getSearchHistory(): TrackingSearchHistory[] {
    const history = localStorage.getItem('tracking_history');
    return history ? JSON.parse(history) : [];
  }

  /**
   * Add to search history
   */
  private addToSearchHistory(trackingNumber: string, status: TrackingStatus): void {
    const history = this.getSearchHistory();
    const existingIndex = history.findIndex(item => item.trackingNumber === trackingNumber);
    
    const newItem: TrackingSearchHistory = {
      trackingNumber,
      searchedAt: new Date().toISOString(),
      status
    };

    if (existingIndex >= 0) {
      history[existingIndex] = newItem;
    } else {
      history.unshift(newItem);
    }

    // Keep only last 10 items
    const trimmedHistory = history.slice(0, 10);
    localStorage.setItem('tracking_history', JSON.stringify(trimmedHistory));
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    localStorage.removeItem('tracking_history');
  }

  /**
   * Get status color and icon
   */
  getStatusInfo(status: TrackingStatus): { color: string; icon: string; label: string } {
    const statusMap = {
      pending: { color: 'text-yellow-600', icon: 'clock', label: 'Pending' },
      picked_up: { color: 'text-blue-600', icon: 'package', label: 'Picked Up' },
      in_transit: { color: 'text-indigo-600', icon: 'truck', label: 'In Transit' },
      delivered: { color: 'text-green-600', icon: 'check', label: 'Delivered' },
      cancelled: { color: 'text-gray-600', icon: 'x', label: 'Cancelled' }
    };

    return statusMap[status] || statusMap.pending;
  }

  /**
   * Check if tracking number is valid format
   */
  isValidTrackingNumber(trackingNumber: string): boolean {
    if (!trackingNumber) return false;
    
    // Remove whitespace and convert to uppercase
    const cleaned = trackingNumber.trim().toUpperCase();
    
    // Basic validation patterns (adjust based on your tracking number format)
    const patterns = [
      /^[A-Z]{2}\d{9}[A-Z]{2}$/, // Example: AB123456789CD
      /^\d{10,20}$/, // Numeric tracking numbers
      /^[A-Z0-9]{8,20}$/ // Alphanumeric
    ];

    return patterns.some(pattern => pattern.test(cleaned));
  }

  /**
   * Format tracking number for display
   */
  formatTrackingNumber(trackingNumber: string): string {
    if (!trackingNumber) return '';
    
    const cleaned = trackingNumber.trim().toUpperCase();
    if (cleaned.length >= 10) {
      return cleaned.replace(/(.{4})/g, '$1 ').trim();
    }
    
    return cleaned;
  }

  /**
   * Map Parcel API response to TrackingInfo
   */
  private mapParcelToTrackingInfo(parcel: any): TrackingInfo {
    // Determine current location based on parcel status and available data
    let currentLocationAddress = 'Loading...';
    let currentLatitude: number | undefined;
    let currentLongitude: number | undefined;
    
    const status = parcel.status?.toLowerCase() || 'pending';
    
    switch (status) {
      case 'pending':
        currentLocationAddress = parcel.pickupLocation || 'Origin';
        currentLatitude = parcel.pickupLatitude;
        currentLongitude = parcel.pickupLongitude;
        break;
      case 'delivered':
        currentLocationAddress = parcel.destinationLocation || 'Destination';
        currentLatitude = parcel.destinationLatitude;
        currentLongitude = parcel.destinationLongitude;
        break;
      case 'picked_up':
      case 'in_transit':
      default:
        // Use explicit current location if available
        if (parcel.currentLocation) {
          currentLocationAddress = parcel.currentLocation;
          currentLatitude = parcel.currentLatitude;
          currentLongitude = parcel.currentLongitude;
        } else {
          // Fallback to calculated midpoint for in-transit packages
          currentLocationAddress = 'In Transit';
          if (parcel.pickupLatitude && parcel.pickupLongitude && 
              parcel.destinationLatitude && parcel.destinationLongitude) {
            currentLatitude = (parcel.pickupLatitude + parcel.destinationLatitude) / 2;
            currentLongitude = (parcel.pickupLongitude + parcel.destinationLongitude) / 2;
          }
        }
        break;
    }

    return {
      trackingNumber: parcel.trackingNumber,
      status: status,
      estimatedDelivery: parcel.estimatedDelivery || this.calculateEstimatedDelivery(parcel),
      actualDelivery: parcel.actualDelivery,
      currentLocation: {
        address: currentLocationAddress,
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: currentLatitude,
        longitude: currentLongitude
      },
      origin: {
        address: parcel.pickupLocation || '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: parcel.pickupLatitude,
        longitude: parcel.pickupLongitude
      },
      destination: {
        address: parcel.destinationLocation || '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        latitude: parcel.destinationLatitude,
        longitude: parcel.destinationLongitude
      },
      events: parcel.events || this.generateMockEvents(parcel),
      serviceType: this.mapServiceType(parcel.serviceType),
      weight: parcel.weight || 0,
      recipient: {
        name: parcel.receiver ? `${parcel.receiver.firstName} ${parcel.receiver.lastName}` : 'Unknown',
        phone: parcel.receiver?.phone || '',
        email: parcel.receiver?.email || ''
      },
      sender: {
        name: parcel.sender ? `${parcel.sender.firstName} ${parcel.sender.lastName}` : 'Unknown',
        phone: parcel.sender?.phone || '',
        email: parcel.sender?.email || ''
      },
      createdAt: parcel.createdAt,
      lastUpdated: parcel.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Map backend service type to frontend display format
   */
  private mapServiceType(serviceType: string): 'LIGHT' | 'MEDIUM' | 'HEAVY' | 'EXTRA_HEAVY' {
    if (!serviceType) return 'LIGHT';
    
    const normalizedType = serviceType.toUpperCase();
    if (['LIGHT', 'LIGHT_PACKAGE'].includes(normalizedType)) return 'LIGHT';
    if (['MEDIUM', 'MEDIUM_PACKAGE'].includes(normalizedType)) return 'MEDIUM';
    if (['HEAVY', 'HEAVY_PACKAGE'].includes(normalizedType)) return 'HEAVY';
    if (['EXTRA_HEAVY', 'EXTRA_HEAVY_PACKAGE'].includes(normalizedType)) return 'EXTRA_HEAVY';
    
    return 'LIGHT'; // Default fallback
  }

  /**
   * Generate mock events for demo purposes
   */
  private generateMockEvents(parcel: any): TrackingEvent[] {
    const baseDate = new Date(parcel.createdAt);
    const events: TrackingEvent[] = [];

    // Always add package created event
    events.push({
      id: '1',
      timestamp: baseDate.toISOString(),
      status: 'pending',
      location: 'Origin Facility',
      description: 'Package information received',
      details: 'Your package has been processed and is ready for pickup'
    });

    // Add more events based on status
    if (['picked_up', 'in_transit', 'delivered'].includes(parcel.status)) {
      events.push({
        id: '2',
        timestamp: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'picked_up',
        location: 'Pickup Location',
        description: 'Package picked up',
        details: 'Package has been collected and is en route to sorting facility'
      });
    }

    if (['in_transit', 'delivered'].includes(parcel.status)) {
      events.push({
        id: '3',
        timestamp: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
        location: 'Sorting Facility',
        description: 'In transit to destination',
        details: 'Package is being transported to destination facility'
      });
    }

    if (['in_transit', 'delivered'].includes(parcel.status)) {
      events.push({
        id: '4',
        timestamp: new Date(baseDate.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
        location: 'Local Facility',
        description: 'In transit',
        details: 'Package is on the delivery vehicle and will be delivered today'
      });
    }

    if (parcel.status === 'delivered') {
      events.push({
        id: '5',
        timestamp: new Date(baseDate.getTime() + 50 * 60 * 60 * 1000).toISOString(),
        status: 'delivered',
        location: parcel.recipientAddress,
        description: 'Package delivered',
        details: 'Package has been successfully delivered to recipient'
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Calculate estimated delivery date
   */
  private calculateEstimatedDelivery(parcel: any): string {
    const created = new Date(parcel.createdAt);
    const serviceType = parcel.serviceType || 'Light Package';

    let deliveryDays = 3; 
    switch (serviceType) {
      case 'Light Package':
        deliveryDays = 2;
        break;
      case 'Medium Package':
        deliveryDays = 1;
        break;
      default:
        deliveryDays = 3;
    }

    const estimatedDate = new Date(created.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
    return estimatedDate.toISOString();
  }
}