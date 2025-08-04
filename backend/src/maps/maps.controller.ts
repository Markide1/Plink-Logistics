/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Param,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { MapsService } from './maps.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommonHelpers } from '../common/helpers';
import * as Joi from 'joi';
import { GeocodeResponseDto } from './dto/maps.dto';

@ApiTags('Maps')
@Controller('maps')
export class MapsController {
  private readonly logger = new Logger(MapsController.name);

  constructor(
    private readonly mapsService: MapsService,
    private readonly prismaService: PrismaService,
  ) {}

  @Public()
  @Get('geocode')
  @ApiOperation({
    summary: 'Geocode an address to get coordinates',
    description:
      'Convert an address string into geographic coordinates (latitude and longitude)',
  })
  @ApiQuery({
    name: 'address',
    description: 'Address to geocode',
    example: '123 Main Street, Nairobi, Kenya',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Address geocoded successfully',
    type: GeocodeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid address provided',
  })
  async geocode(@Query('address') address: string) {
    const schema = Joi.string().min(5).required();
    const { error } = schema.validate(address);
    if (error) {
      throw new BadRequestException('Invalid address provided');
    }
    return this.mapsService.geocodeAddress(address);
  }

  @Public()
  @Get('reverse-geocode')
  @ApiOperation({
    summary: 'Reverse geocode coordinates to get address',
    description:
      'Convert geographic coordinates (latitude and longitude) into a human-readable address',
  })
  @ApiQuery({
    name: 'latitude',
    description: 'Latitude coordinate (-90 to 90)',
    example: '-1.2921',
    type: Number,
  })
  @ApiQuery({
    name: 'longitude',
    description: 'Longitude coordinate (-180 to 180)',
    example: '36.8219',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Coordinates reverse geocoded successfully',
    type: GeocodeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid coordinates provided',
  })
  async reverseGeocode(
    @Query('latitude') lat: string,
    @Query('longitude') lng: string,
  ) {
    const schema = Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required(),
    });
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const { error, value } = schema.validate({ lat: latNum, lng: lngNum });
    if (error) {
      throw new BadRequestException('Invalid coordinates provided');
    }
    const { lat: validatedLat, lng: validatedLng } = value as {
      lat: number;
      lng: number;
    };
    return this.mapsService.reverseGeocode(validatedLat, validatedLng);
  }

  @Public()
  @Get('distance')
  @ApiOperation({ summary: 'Calculate distance between two addresses' })
  @ApiQuery({ name: 'origin', description: 'Origin address' })
  @ApiQuery({ name: 'destination', description: 'Destination address' })
  @ApiResponse({ status: 200, description: 'Distance calculated successfully' })
  async getDistance(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    const schema = Joi.object({
      origin: Joi.string().min(5).required(),
      destination: Joi.string().min(5).required(),
    });
    const { error } = schema.validate({ origin, destination });
    if (error) {
      throw new BadRequestException('Invalid origin or destination provided');
    }
    return this.mapsService.calculateDistance(origin, destination);
  }

  @Public()
  @Post('haversine-distance')
  @ApiOperation({
    summary: 'Calculate straight-line distance between coordinates',
  })
  @ApiResponse({
    status: 200,
    description: 'Haversine distance calculated successfully',
  })
  async calculateHaversineDistance(
    @Body()
    body: {
      lat1: number;
      lng1: number;
      lat2: number;
      lng2: number;
    },
  ) {
    const { lat1, lng1, lat2, lng2 } = body;

    const schema = Joi.object({
      lat1: Joi.number().required(),
      lng1: Joi.number().required(),
      lat2: Joi.number().required(),
      lng2: Joi.number().required(),
    });

    const { error } = schema.validate({ lat1, lng1, lat2, lng2 });
    if (error) {
      throw new BadRequestException(
        'All coordinate parameters are required and must be numbers',
      );
    }

    try {
      const distance = this.mapsService.calculateHaversineDistance(
        lat1,
        lng1,
        lat2,
        lng2,
      );
      return CommonHelpers.createResponse(
        true,
        'Haversine distance calculated successfully',
        {
          distance: distance,
          unit: 'kilometers',
          formatted: `${distance.toFixed(2)} km`,
        },
      );
    } catch (error) {
      throw new BadRequestException('Failed to calculate distance');
    }
  }

  @Get('parcel/:id/map-data')
  @ApiOperation({
    summary: 'Get map data for a specific parcel for frontend display',
  })
  @ApiParam({ name: 'id', description: 'Parcel ID' })
  @ApiResponse({
    status: 200,
    description: 'Parcel map data retrieved successfully',
  })
  async getParcelMapData(@Param('id') parcelId: string) {
    try {
      const parcel = await this.prismaService.parcel.findFirst({
        where: {
          id: parcelId,
          isDeleted: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!parcel) {
        return CommonHelpers.createResponse(
          false,
          'Parcel not found',
          null,
          404,
        );
      }

      // Calculate distance if both coordinates are available
      let estimatedDistance: {
        value: number;
        formatted: string;
        unit: string;
      } | null = null;
      if (
        parcel.pickupLatitude &&
        parcel.pickupLongitude &&
        parcel.destinationLatitude &&
        parcel.destinationLongitude
      ) {
        const distance = this.mapsService.calculateHaversineDistance(
          parcel.pickupLatitude,
          parcel.pickupLongitude,
          parcel.destinationLatitude,
          parcel.destinationLongitude,
        );
        estimatedDistance = {
          value: distance,
          formatted: `${distance.toFixed(2)} km`,
          unit: 'kilometers',
        };
      }

      const mapData = {
        parcelId: parcel.id,
        trackingNumber: parcel.trackingNumber,
        status: parcel.status,
        pickup: {
          location: parcel.pickupLocation,
          latitude: parcel.pickupLatitude,
          longitude: parcel.pickupLongitude,
          marker: {
            title: 'Pickup Location',
            description: `Pickup: ${parcel.pickupLocation}`,
            icon: 'pickup',
            color: '#4CAF50', // Green for pickup
          },
        },
        destination: {
          location: parcel.destinationLocation,
          latitude: parcel.destinationLatitude,
          longitude: parcel.destinationLongitude,
          marker: {
            title: 'Destination',
            description: `Delivery to: ${parcel.destinationLocation}`,
            icon: 'destination',
            color: '#F44336', // Red for destination
          },
        },
        route: {
          estimatedDistance,
          waypoints: [
            {
              lat: parcel.pickupLatitude,
              lng: parcel.pickupLongitude,
              type: 'pickup',
            },
            {
              lat: parcel.destinationLatitude,
              lng: parcel.destinationLongitude,
              type: 'destination',
            },
          ].filter((point) => point.lat && point.lng),
        },
        parcelInfo: {
          description: parcel.description,
          weight: parcel.weight,
          price: parcel.price,
          sender: parcel.sender,
          receiver: parcel.receiver,
          createdAt: parcel.createdAt,
        },
        mapCenter:
          parcel.pickupLatitude &&
          parcel.pickupLongitude &&
          parcel.destinationLatitude &&
          parcel.destinationLongitude
            ? {
                lat: (parcel.pickupLatitude + parcel.destinationLatitude) / 2,
                lng: (parcel.pickupLongitude + parcel.destinationLongitude) / 2,
              }
            : parcel.pickupLatitude && parcel.pickupLongitude
              ? {
                  lat: parcel.pickupLatitude,
                  lng: parcel.pickupLongitude,
                }
              : null,
      };

      return CommonHelpers.createResponse(
        true,
        'Parcel map data retrieved successfully',
        mapData,
      );
    } catch (error) {
      this.logger.error('Failed to retrieve parcel map data:', error);
      return CommonHelpers.createResponse(
        false,
        'Failed to retrieve parcel map data',
        null,
        500,
      );
    }
  }

  @Get('parcels/map-overview')
  @ApiOperation({ summary: 'Get overview of all parcels for map display' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by parcel status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limit number of parcels',
  })
  @ApiResponse({
    status: 200,
    description: 'Parcels map overview retrieved successfully',
  })
  async getParcelsMapOverview(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const whereClause: any = {
        isDeleted: false,
        pickupLatitude: { not: null },
        pickupLongitude: { not: null },
      };

      if (status) {
        whereClause.status = status;
      }

      const parcels = await this.prismaService.parcel.findMany({
        where: whereClause,
        take: limit ? parseInt(limit) : 100,
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          pickupLocation: true,
          pickupLatitude: true,
          pickupLongitude: true,
          destinationLocation: true,
          destinationLatitude: true,
          destinationLongitude: true,
          description: true,
          weight: true,
          price: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const mapData = parcels.map((parcel) => {
        let estimatedDistance: string | null = null;
        if (
          parcel.pickupLatitude &&
          parcel.pickupLongitude &&
          parcel.destinationLatitude &&
          parcel.destinationLongitude
        ) {
          const distance = this.mapsService.calculateHaversineDistance(
            parcel.pickupLatitude,
            parcel.pickupLongitude,
            parcel.destinationLatitude,
            parcel.destinationLongitude,
          );
          estimatedDistance = `${distance.toFixed(2)} km`;
        }

        return {
          parcelId: parcel.id,
          trackingNumber: parcel.trackingNumber,
          status: parcel.status,
          pickup: {
            location: parcel.pickupLocation,
            coordinates: {
              lat: parcel.pickupLatitude,
              lng: parcel.pickupLongitude,
            },
          },
          destination: {
            location: parcel.destinationLocation,
            coordinates:
              parcel.destinationLatitude && parcel.destinationLongitude
                ? {
                    lat: parcel.destinationLatitude,
                    lng: parcel.destinationLongitude,
                  }
                : null,
          },
          estimatedDistance,
          summary: {
            description: parcel.description,
            weight: parcel.weight,
            price: parcel.price,
            createdAt: parcel.createdAt,
          },
        };
      });

      return CommonHelpers.createResponse(
        true,
        'Parcels map overview retrieved successfully',
        {
          parcels: mapData,
          total: mapData.length,
          bounds: this.calculateMapBounds(mapData),
        },
      );
    } catch (error) {
      this.logger.error('Failed to retrieve parcels map overview:', error);
      return CommonHelpers.createResponse(
        false,
        'Failed to retrieve parcels map overview',
        null,
        500,
      );
    }
  }

  private calculateMapBounds(parcels: any[]) {
    if (parcels.length === 0) return null;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    parcels.forEach((parcel) => {
      if (parcel.pickup.coordinates) {
        minLat = Math.min(minLat, parcel.pickup.coordinates.lat);
        maxLat = Math.max(maxLat, parcel.pickup.coordinates.lat);
        minLng = Math.min(minLng, parcel.pickup.coordinates.lng);
        maxLng = Math.max(maxLng, parcel.pickup.coordinates.lng);
      }

      if (parcel.destination.coordinates) {
        minLat = Math.min(minLat, parcel.destination.coordinates.lat);
        maxLat = Math.max(maxLat, parcel.destination.coordinates.lat);
        minLng = Math.min(minLng, parcel.destination.coordinates.lng);
        maxLng = Math.max(maxLng, parcel.destination.coordinates.lng);
      }
    });

    return {
      southwest: { lat: minLat, lng: minLng },
      northeast: { lat: maxLat, lng: maxLng },
      center: {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
      },
    };
  }
}
