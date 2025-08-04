/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  formattedAddress: string;
}

export interface DistanceResult {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  origin: string;
  destination: string;
}

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key is not configured');
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API is not configured');
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.baseUrl}/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;

        return {
          address,
          latitude: location.lat,
          longitude: location.lng,
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
        };
      } else {
        throw new BadRequestException(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      this.logger.error('Geocoding error:', error);
      throw new BadRequestException('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeocodeResult> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API is not configured');
    }

    try {
      const url = `${this.baseUrl}/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];

        return {
          address: result.formatted_address,
          latitude,
          longitude,
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
        };
      } else {
        throw new BadRequestException(
          `Reverse geocoding failed: ${data.status}`,
        );
      }
    } catch (error) {
      this.logger.error('Reverse geocoding error:', error);
      throw new BadRequestException('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Calculate distance and duration between two addresses
   */
  async calculateDistance(
    origin: string,
    destination: string,
  ): Promise<DistanceResult> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API is not configured');
    }

    try {
      const encodedOrigin = encodeURIComponent(origin);
      const encodedDestination = encodeURIComponent(destination);
      const url = `${this.baseUrl}/distancematrix/json?origins=${encodedOrigin}&destinations=${encodedDestination}&key=${this.apiKey}&units=metric`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.rows.length > 0) {
        const element = data.rows[0].elements[0];

        if (element.status === 'OK') {
          return {
            distance: element.distance,
            duration: element.duration,
            origin: data.origin_addresses[0],
            destination: data.destination_addresses[0],
          };
        } else {
          throw new BadRequestException(
            `Distance calculation failed: ${element.status}`,
          );
        }
      } else {
        throw new BadRequestException(`Distance matrix failed: ${data.status}`);
      }
    } catch (error) {
      this.logger.error('Distance calculation error:', error);
      throw new BadRequestException('Failed to calculate distance');
    }
  }

  /**
   * Calculate distance between two coordinate points using Haversine formula
   */
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreeToRadians(lat2 - lat1);
    const dLon = this.degreeToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreeToRadians(lat1)) *
        Math.cos(this.degreeToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return distance;
  }

  /**
   * Get nearby places (optional feature)
   */
  async getNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000,
    type: string = 'establishment',
  ) {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API is not configured');
    }

    try {
      const url = `${this.baseUrl}/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${this.apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.results.map((place: any) => ({
          name: place.name,
          placeId: place.place_id,
          location: place.geometry.location,
          rating: place.rating,
          vicinity: place.vicinity,
          types: place.types,
        }));
      } else {
        throw new BadRequestException(`Nearby search failed: ${data.status}`);
      }
    } catch (error) {
      this.logger.error('Nearby places search error:', error);
      throw new BadRequestException('Failed to search nearby places');
    }
  }

  /**
   * Get route polyline coordinates between two addresses using Google Maps Directions API
   */
  async getRoutePolyline(
    origin: string,
    destination: string,
  ): Promise<{ polyline: [number, number][] }> {
    if (!this.apiKey) {
      throw new BadRequestException('Google Maps API is not configured');
    }
    try {
      const encodedOrigin = encodeURIComponent(origin);
      const encodedDestination = encodeURIComponent(destination);
      const url = `${this.baseUrl}/directions/json?origin=${encodedOrigin}&destination=${encodedDestination}&key=${this.apiKey}&units=metric`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        // Decode polyline to array of lat/lng
        const polylineStr = data.routes[0].overview_polyline.points;
        if (typeof polylineStr !== 'string') {
          throw new BadRequestException(
            'Invalid polyline string from Directions API',
          );
        }
        const polyline = this.decodePolyline(polylineStr);
        return { polyline };
      } else {
        throw new BadRequestException(`Directions API failed: ${data.status}`);
      }
    } catch (error) {
      this.logger.error('Directions API error:', error);
      throw new BadRequestException('Failed to get route polyline');
    }
  }

  /**
   * Decode Google Maps encoded polyline string to array of [lat, lng]
   */
  private decodePolyline(encoded: string): [number, number][] {
    const points: [number, number][] = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < encoded.length) {
      let b: number,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }
    return points;
  }

  private degreeToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
