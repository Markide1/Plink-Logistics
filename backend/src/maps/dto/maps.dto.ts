import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Max } from 'class-validator';

export class GeocodeQueryDto {
  @ApiProperty({
    description: 'Address to geocode',
    example: '123 Main Street, Nairobi, Kenya',
    minLength: 5,
  })
  @IsString()
  address: string;
}

export class ReverseGeocodeQueryDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: -1.2921,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: 36.8219,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

export class DistanceQueryDto {
  @ApiProperty({
    description: 'Origin address',
    example: 'Nairobi CBD, Kenya',
    minLength: 5,
  })
  @IsString()
  origin: string;

  @ApiProperty({
    description: 'Destination address',
    example: 'Westlands, Nairobi, Kenya',
    minLength: 5,
  })
  @IsString()
  destination: string;
}

export class CoordinateDto {
  @ApiProperty({ description: 'Latitude', example: -1.2921 })
  lat: number;

  @ApiProperty({ description: 'Longitude', example: 36.8219 })
  lng: number;
}

export class LocationDto {
  @ApiProperty({
    description: 'Address or location name',
    example: 'Nairobi CBD, Kenya',
  })
  address: string;

  @ApiProperty({ description: 'Coordinates', type: CoordinateDto })
  coordinates: CoordinateDto;
}

export class GeocodeResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Address geocoded successfully',
  })
  message: string;

  @ApiProperty({ description: 'Location data', type: LocationDto })
  data: LocationDto;
}

export class DistanceResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Distance calculated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Distance data',
    example: {
      distance: 5.2,
      unit: 'kilometers',
      formatted: '5.20 km',
      duration: '15 minutes',
      origin: 'Nairobi CBD, Kenya',
      destination: 'Westlands, Nairobi, Kenya',
    },
  })
  data: {
    distance: number;
    unit: string;
    formatted: string;
    duration?: string;
    origin: string;
    destination: string;
  };
}

export class ParcelMapDataResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Parcel map data retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Parcel map data',
    example: {
      parcelId: 'parcel-123',
      trackingNumber: 'TRK123456',
      status: 'IN_TRANSIT',
      pickup: {
        location: 'Nairobi CBD, Kenya',
        latitude: -1.2921,
        longitude: 36.8219,
        marker: {
          title: 'Pickup Location',
          description: 'Pickup: Nairobi CBD, Kenya',
          icon: 'pickup',
          color: '#4CAF50',
        },
      },
      destination: {
        location: 'Westlands, Nairobi, Kenya',
        latitude: -1.2635,
        longitude: 36.8094,
        marker: {
          title: 'Destination',
          description: 'Delivery to: Westlands, Nairobi, Kenya',
          icon: 'destination',
          color: '#F44336',
        },
      },
      route: {
        estimatedDistance: {
          value: 5.2,
          formatted: '5.20 km',
          unit: 'kilometers',
        },
      },
    },
  })
  data: any;
}

export class ParcelsMapOverviewResponseDto {
  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Parcels map overview retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Parcels map overview data',
    example: {
      parcels: [
        {
          parcelId: 'parcel-123',
          trackingNumber: 'TRK123456',
          status: 'IN_TRANSIT',
          pickup: {
            location: 'Nairobi CBD, Kenya',
            coordinates: { lat: -1.2921, lng: 36.8219 },
          },
          destination: {
            location: 'Westlands, Nairobi, Kenya',
            coordinates: { lat: -1.2635, lng: 36.8094 },
          },
          estimatedDistance: '5.20 km',
        },
      ],
      total: 1,
      bounds: {
        southwest: { lat: -1.2921, lng: 36.8094 },
        northeast: { lat: -1.2635, lng: 36.8219 },
        center: { lat: -1.2778, lng: 36.81565 },
      },
    },
  })
  data: any;
}
