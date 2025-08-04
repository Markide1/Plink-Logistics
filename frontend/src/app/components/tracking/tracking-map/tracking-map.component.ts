import { Component, Input, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

export interface MapLocation {
  latitude: number;
  longitude: number;
  address: string;
  label?: string;
  type?: 'origin' | 'current' | 'destination';
}

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-map.html',
  styleUrls: ['./tracking-map.scss']
})
export class TrackingMapComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Input() locations: MapLocation[] = [];
  @Input() currentLocation?: MapLocation;
  @Input() lastUpdated?: string;
  @Input() routePolyline: [number, number][] = []; // Add this input

  private map?: L.Map;
  private markers: L.Marker[] = [];
  private polyline?: L.Polyline;
  public isMapInitialized: boolean = false;

  constructor() {}

  ngOnInit() {
    this.configureLeafletDefaults();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeMap();
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isMapInitialized && changes['locations'] && !changes['locations'].firstChange) {
      this.updateMapLocations();
    }
    if (this.isMapInitialized && changes['currentLocation'] && !changes['currentLocation'].firstChange) {
      this.updateCurrentLocationMarker();
    }
    if (this.isMapInitialized && changes['routePolyline'] && !changes['routePolyline'].firstChange) {
      this.drawRoutePolyline();
    }
  }

  getCurrentLocationAddress(): string {
    // Find the current location marker from locations array
    const currentLocationMarker = this.locations.find(loc => loc.type === 'current');
    return currentLocationMarker?.address || this.currentLocation?.address || 'Loading...';
  }

  private updateCurrentLocationMarker() {
    if (!this.map || !this.currentLocation) return;
    
    // Update the current location marker if it exists
    const currentMarkerIndex = 1; // Current location is always at index 1
    if (this.markers[currentMarkerIndex]) {
      this.map.removeLayer(this.markers[currentMarkerIndex]);
      const newMarker = this.createMarker(this.currentLocation);
      this.markers[currentMarkerIndex] = newMarker;
      newMarker.addTo(this.map);
    }
  }

  ngOnDestroy() {
    this.clearMap();
  }

  private configureLeafletDefaults() {
    const iconDefault = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  private initializeMap() {
    if (this.map) {
      this.clearMap();
    }

    const defaultCenter: [number, number] = this.getDefaultCenter();

    this.map = L.map(this.mapContainer.nativeElement, {
      center: defaultCenter,
      zoom: 12,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true
    }).addTo(this.map);

    this.isMapInitialized = true;
    this.updateMapLocations();
  }

  private getDefaultCenter(): [number, number] {
    if (this.locations && this.locations.length > 0) {
      const firstLocation = this.locations[0];
      if (firstLocation.latitude !== 0 && firstLocation.longitude !== 0) {
        return [firstLocation.latitude, firstLocation.longitude];
      }
    }
    return [-1.286389, 36.817223]; 
  }

  private updateMapLocations() {
    if (!this.map || !this.isMapInitialized) return;

    this.clearMarkers();

    if (!this.locations || this.locations.length === 0) {
      this.addDemoLocations();
      return;
    }

    const validLocations = this.locations.filter(loc => 
      loc.latitude !== 0 && loc.longitude !== 0 && 
      !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
      loc.latitude >= -90 && loc.latitude <= 90 &&
      loc.longitude >= -180 && loc.longitude <= 180
    );

    if (validLocations.length === 0) {
      this.addDemoLocations();
      return;
    }

    const bounds = L.latLngBounds([]);
    
    validLocations.forEach(location => {
      const marker = this.createMarker(location);
      this.markers.push(marker);
      marker.addTo(this.map!);
      bounds.extend([location.latitude, location.longitude]);
    });

    // Fit map to show all markers
    if (validLocations.length > 1) {
      this.map.fitBounds(bounds.pad(0.1));
    } else {
      this.map.setView([validLocations[0].latitude, validLocations[0].longitude], 12);
    }

    // Only draw routePolyline, do not draw straight line
    this.drawRoutePolyline();
  }

  private clearMarkers() {
    this.markers.forEach(marker => {
      if (this.map && this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
    
    if (this.polyline && this.map && this.map.hasLayer(this.polyline)) {
      this.map.removeLayer(this.polyline);
      this.polyline = undefined;
    }
  }

  private clearMap() {
    if (this.map) {
      this.clearMarkers();
      this.map.remove();
      this.map = undefined;
      this.isMapInitialized = false;
    }
  }

  private createMarker(location: MapLocation): L.Marker {
    const icon = this.getMarkerIcon(location.type);

    return L.marker([location.latitude, location.longitude], { icon })
      .bindPopup(`
        <div class="text-center p-2">
          <strong class="text-blue-700">${location.label || location.type || 'Location'}</strong><br>
          <small class="text-gray-600">${location.address}</small>
        </div>
      `);
  }

  private getMarkerIcon(type?: string): L.Icon {
    if (type === 'origin') {
      return L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
    } else if (type === 'destination') {
      return L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
    } else if (type === 'current') {
      // Special icon for current location (blue)
      return L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
    }
    // Default icon
    return L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  private drawRoutePolyline() {
    if (!this.map || !this.routePolyline || this.routePolyline.length < 2) return;
    // Remove previous polyline
    if (this.polyline && this.map.hasLayer(this.polyline)) {
      this.map.removeLayer(this.polyline);
    }
    // Convert [lat, lng] to LatLng[]
    const latLngs = this.routePolyline.map(([lat, lng]) => L.latLng(lat, lng));
    this.polyline = L.polyline(latLngs, {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.8,
      dashArray: undefined
    }).addTo(this.map);
    // Fit bounds to route
    const bounds = L.latLngBounds(latLngs);
    this.map.fitBounds(bounds.pad(0.1));
  }

  private addDemoLocations() {
    if (!this.map) return;

    const demoLocations: MapLocation[] = [
      {
        latitude: -0.3346,
        longitude: 37.6359,
        address: 'Chuka University, Chuka',
        label: 'Origin',
        type: 'origin'
      },
      {
        latitude: -0.939239,
        longitude: 37.124696,
        address: 'Kenol Township',
        label: 'Current Location',
        type: 'current'
      },
      {
        latitude: -1.2648,
        longitude: 36.8001,
        address: 'Westlands, Nairobi',
        label: 'Destination',
        type: 'destination'
      }
    ];

    const bounds = L.latLngBounds([]);
    
    demoLocations.forEach(location => {
      const marker = this.createMarker(location);
      this.markers.push(marker);
      marker.addTo(this.map!);
      bounds.extend([location.latitude, location.longitude]);
    });

    this.map.fitBounds(bounds.pad(0.1));
    this.drawRoutePolyline();
  }

  formatLastUpdated(): string {
    if (!this.lastUpdated) return 'N/A';
    
    try {
      const date = new Date(this.lastUpdated);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'N/A';
    }
  }
}