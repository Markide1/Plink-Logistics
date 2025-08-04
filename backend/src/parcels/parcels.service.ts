/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommonHelpers } from '../common/helpers';
import { RESPONSE_MESSAGES, PARCEL_STATUS } from '../common/constants';
import {
  CreateParcelDto,
  UpdateParcelStatusDto,
  ParcelQueryDto,
} from './dto/parcel.dto';
import { EmailService } from '../email/email.service';
import { MapsService } from '../maps/maps.service';

@Injectable()
export class ParcelsService {
  private readonly logger = new Logger(ParcelsService.name);

  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
    private mapsService: MapsService,
  ) {}

  async createParcel(senderId: string, createParcelDto: CreateParcelDto) {
    const {
      receiverEmail,
      description,
      weight,
      pickupLocation,
      pickupLatitude,
      pickupLongitude,
      destinationLocation,
      destinationLatitude,
      destinationLongitude,
      parcelRequestId,
    } = createParcelDto;

    let receiver = await this.prismaService.user.findUnique({
      where: { email: receiverEmail },
    });

    // If receiver doesn't exist, create a new user account with temporary password
    if (!receiver) {
      // Generate temporary password
      const tempPassword = CommonHelpers.generateRandomString(12);
      const hashedTempPassword = await CommonHelpers.hashPassword(tempPassword);
      const tempPasswordExpiry = new Date();
      tempPasswordExpiry.setHours(tempPasswordExpiry.getHours() + 24); // 24 hours from now

      // Extract first name from email or use default
      const firstName = receiverEmail.split('@')[0] || 'User';
      const lastName = '';

      // Create new user account
      receiver = await this.prismaService.user.create({
        data: {
          email: receiverEmail,
          firstName,
          lastName,
          phone: '',
          password: hashedTempPassword,
          role: 'USER',
          tempPassword: hashedTempPassword,
          tempPasswordExpiry,
        },
      });

      // Always send credentials email to new user
      await this.emailService.sendNewUserCredentials(
        receiver.email,
        receiver.firstName,
        receiver.lastName,
        tempPassword,
        tempPasswordExpiry,
      );

      this.logger.log(
        `Created new user account for receiver: ${receiver.email}`,
      );
    } else {
      // Prevent sending parcels to admin accounts if user exists
      if (receiver.role === 'ADMIN') {
        throw new BadRequestException('Cannot send parcels to admin accounts.');
      }
    }

    try {
      const price = CommonHelpers.calculateParcelPrice(weight);
      const trackingNumber = CommonHelpers.generateTrackingNumber();

      // Automatically geocode pickup location if coordinates not provided
      let finalPickupLatitude = pickupLatitude;
      let finalPickupLongitude = pickupLongitude;
      let finalPickupLocation = pickupLocation;

      if (!pickupLatitude || !pickupLongitude) {
        try {
          this.logger.log(`Geocoding pickup location: ${pickupLocation}`);
          const pickupGeocode =
            await this.mapsService.geocodeAddress(pickupLocation);
          finalPickupLatitude = pickupGeocode.latitude;
          finalPickupLongitude = pickupGeocode.longitude;
          finalPickupLocation = pickupGeocode.formattedAddress;
          this.logger.log(
            `Pickup location geocoded: ${finalPickupLocation} (${finalPickupLatitude}, ${finalPickupLongitude})`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to geocode pickup location '${pickupLocation}': ${error}`,
          );
        }
      }

      // Automatically geocode destination location
      let finalDestinationLatitude = destinationLatitude;
      let finalDestinationLongitude = destinationLongitude;
      let finalDestinationLocation = destinationLocation;

      if (!destinationLatitude || !destinationLongitude) {
        try {
          this.logger.log(
            `Geocoding destination location: ${destinationLocation}`,
          );
          const destinationGeocode =
            await this.mapsService.geocodeAddress(destinationLocation);
          finalDestinationLatitude = destinationGeocode.latitude;
          finalDestinationLongitude = destinationGeocode.longitude;
          finalDestinationLocation = destinationGeocode.formattedAddress;
          this.logger.log(
            `Destination location geocoded: ${finalDestinationLocation} (${finalDestinationLatitude}, ${finalDestinationLongitude})`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to geocode destination location '${destinationLocation}': ${error.message}`,
          );
        }
      }

      // Use Google Maps Directions API for route-based distance and delivery time
      let estimatedDistance: number | null = null;
      let estimatedDuration: number | null = null;
      try {
        const { getGoogleMapsRoute } = await import('../common/helpers');
        const routeInfo = await getGoogleMapsRoute(
          finalPickupLocation,
          finalDestinationLocation,
        );
        if (routeInfo) {
          estimatedDistance = routeInfo.distance;
          estimatedDuration = routeInfo.duration;
          this.logger.log(
            `Google Maps route: ${estimatedDistance} km, ${estimatedDuration} hours between ${finalPickupLocation} and ${finalDestinationLocation}`,
          );
        } else {
          this.logger.warn('Google Maps route info not available.');
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch Google Maps route: ${error.message}`);
      }

      // If created from request or directly, set to PICKED_UP and current location to pickup location
      const initialStatus = 'PICKED_UP';
      const currentLocation = finalPickupLocation;
      const currentLatitude = finalPickupLatitude;
      const currentLongitude = finalPickupLongitude;

      const parcel = await this.prismaService.parcel.create({
        data: {
          senderId,
          receiverId: receiver.id,
          description,
          weight,
          price,
          status:
            initialStatus as (typeof PARCEL_STATUS)[keyof typeof PARCEL_STATUS],
          currentLocation,
          currentLatitude,
          currentLongitude,
          pickupLocation: finalPickupLocation,
          pickupLatitude: finalPickupLatitude,
          pickupLongitude: finalPickupLongitude,
          destinationLocation: finalDestinationLocation,
          destinationLatitude: finalDestinationLatitude,
          destinationLongitude: finalDestinationLongitude,
          trackingNumber,
          ...(parcelRequestId ? { parcelRequestId } : {}),
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // Send email notifications
      await this.notifySenderAndReceiver(parcel);

      // Remove sensitive fields from sender and receiver
      const sanitizedParcel = {
        ...parcel,
        // Add calculated distance and estimated delivery time
        estimatedDistance: estimatedDistance
          ? `${estimatedDistance.toFixed(2)} km`
          : null,
        estimatedDeliveryTime: estimatedDuration
          ? `${estimatedDuration} hours`
          : null,
        sender: parcel.sender
          ? {
              id: parcel.sender.id,
              firstName: parcel.sender.firstName,
              lastName: parcel.sender.lastName,
              email: parcel.sender.email,
              phone: parcel.sender.phone,
              role: parcel.sender.role,
              createdAt: parcel.sender.createdAt,
              updatedAt: parcel.sender.updatedAt,
            }
          : undefined,
        receiver: parcel.receiver
          ? {
              id: parcel.receiver.id,
              firstName: parcel.receiver.firstName,
              lastName: parcel.receiver.lastName,
              email: parcel.receiver.email,
              phone: parcel.receiver.phone,
              role: parcel.receiver.role,
              createdAt: parcel.receiver.createdAt,
              updatedAt: parcel.receiver.updatedAt,
            }
          : undefined,
      };
      return CommonHelpers.createResponse(
        true,
        RESPONSE_MESSAGES.PARCEL_CREATED,
        sanitizedParcel,
        201,
      );
    } catch (error) {
      this.logger.error('Failed to create parcel:', error);
      throw new BadRequestException('Failed to create parcel');
    }
  }

  async getParcelById(parcelId: string, userId?: string, userEmail?: string) {
    const parcel = await this.prismaService.parcel.findFirst({
      where: {
        id: parcelId,
        isDeleted: false,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException(RESPONSE_MESSAGES.PARCEL_NOT_FOUND);
    }

    // Enforce user ownership: only sender or receiver can access
    if (
      userId &&
      parcel.senderId !== userId &&
      parcel.receiverId !== userId &&
      parcel.receiver?.email !== userEmail
    ) {
      throw new BadRequestException('You do not have access to this parcel');
    }

    // Always use Google Maps Directions API for route distance and time
    let routeInfo: { distance: number; duration: number } | null = null;
    try {
      const { getGoogleMapsRoute } = await import('../common/helpers');
      routeInfo = await getGoogleMapsRoute(
        parcel.pickupLocation,
        parcel.destinationLocation,
      );
    } catch {
      routeInfo = null;
    }

    const sanitizeUser = (
      user:
        | {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: string;
            profileImage?: string | null;
            createdAt: Date;
            updatedAt: Date;
          }
        | undefined,
    ) => {
      if (!user) return undefined;
      const {
        id,
        firstName,
        lastName,
        email,
        phone,
        role,
        profileImage,
        createdAt,
        updatedAt,
      } = user;
      return {
        id,
        firstName,
        lastName,
        email,
        phone: phone ?? '',
        role,
        profileImage,
        createdAt,
        updatedAt,
      };
    };

    const sanitizedParcel = {
      ...parcel,
      estimatedDistance: routeInfo ? `${routeInfo.distance} km` : null,
      estimatedDeliveryTime: routeInfo ? `${routeInfo.duration} hours` : null,
      sender: sanitizeUser(parcel.sender),
      receiver: sanitizeUser(parcel.receiver),
    };
    return CommonHelpers.createResponse(
      true,
      RESPONSE_MESSAGES.PARCEL_FETCHED,
      sanitizedParcel,
    );
  }

  async updateParcelStatus(
    parcelId: string,
    updateParcelStatusDto: UpdateParcelStatusDto,
  ) {
    const parcel = await this.prismaService.parcel.findFirst({
      where: {
        id: parcelId,
        isDeleted: false,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException(RESPONSE_MESSAGES.PARCEL_NOT_FOUND);
    }

    try {
      if (!parcel) {
        throw new BadRequestException('Parcel not found');
      }
      // Validate status
      const allowedStatuses = [
        'PENDING',
        'PICKED_UP',
        'IN_TRANSIT',
        'DELIVERED',
        'RECEIVED',
        'CANCELLED',
      ];
      if (!allowedStatuses.includes(updateParcelStatusDto.status)) {
        throw new BadRequestException('Invalid parcel status');
      }
      // Prepare update data
      const updateData: any = {
        status:
          updateParcelStatusDto.status as (typeof PARCEL_STATUS)[keyof typeof PARCEL_STATUS],
        updatedAt: new Date(),
      };

      // If status is DELIVERED, set current location to delivery location
      if (updateParcelStatusDto.status === 'DELIVERED') {
        updateData.currentLocation = parcel.destinationLocation;
        updateData.currentLatitude = parcel.destinationLatitude;
        updateData.currentLongitude = parcel.destinationLongitude;
      } else if (updateParcelStatusDto.currentLocation) {
        // Handle current location update with geocoding
        updateData.currentLocation = updateParcelStatusDto.currentLocation;
        try {
          this.logger.log(
            `Geocoding current location: ${updateParcelStatusDto.currentLocation}`,
          );
          const currentLocationGeocode = await this.mapsService.geocodeAddress(
            updateParcelStatusDto.currentLocation,
          );
          updateData.currentLatitude = currentLocationGeocode.latitude;
          updateData.currentLongitude = currentLocationGeocode.longitude;
          updateData.currentLocation = currentLocationGeocode.formattedAddress;
          this.logger.log(
            `Current location geocoded: ${updateData.currentLocation} (${updateData.currentLatitude}, ${updateData.currentLongitude})`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to geocode current location '${updateParcelStatusDto.currentLocation}': ${error.message}`,
          );
        }
      }
      const updatedParcel = await this.prismaService.parcel.update({
        where: { id: parcelId },
        data: updateData,
        include: {
          sender: true,
          receiver: true,
        },
      });
      // Send email notifications
      await this.notifySenderAndReceiver(updatedParcel);
      // Auto-create payment if status is DELIVERED and no payment exists
      if (updateParcelStatusDto.status === 'DELIVERED') {
        const existingPayment = await this.prismaService.payment.findUnique({
          where: { parcelId: updatedParcel.id },
        });
        if (!existingPayment) {
          await this.prismaService.payment.create({
            data: {
              parcelId: updatedParcel.id,
              amount: updatedParcel.price,
              status: 'COMPLETED',
              currency: 'KES',
              processedAt: new Date(),
              method: 'CASH',
            },
          });
        }
      }

      const sanitizedParcel = {
        ...updatedParcel,
        sender: updatedParcel.sender
          ? {
              id: updatedParcel.sender.id,
              firstName: updatedParcel.sender.firstName,
              lastName: updatedParcel.sender.lastName,
              email: updatedParcel.sender.email,
              phone: updatedParcel.sender.phone,
              role: updatedParcel.sender.role,
              createdAt: updatedParcel.sender.createdAt,
              updatedAt: updatedParcel.sender.updatedAt,
            }
          : undefined,
        receiver: updatedParcel.receiver
          ? {
              id: updatedParcel.receiver.id,
              firstName: updatedParcel.receiver.firstName,
              lastName: updatedParcel.receiver.lastName,
              email: updatedParcel.receiver.email,
              phone: updatedParcel.receiver.phone,
              role: updatedParcel.receiver.role,
              createdAt: updatedParcel.receiver.createdAt,
              updatedAt: updatedParcel.receiver.updatedAt,
            }
          : undefined,
      };
      return CommonHelpers.createResponse(
        true,
        RESPONSE_MESSAGES.PARCEL_UPDATED,
        sanitizedParcel,
      );
    } catch (error) {
      this.logger.error('Failed to update parcel status:', error);
      throw new BadRequestException('Failed to update parcel status');
    }
  }

  async bulkUpdateStatus(parcelIds: string[], status: string) {
    if (!parcelIds || !Array.isArray(parcelIds) || !status) {
      return { message: 'Invalid input', updatedCount: 0 };
    }

    // If status is DELIVERED, update currentLocation
    if (status === 'DELIVERED') {
      const parcels = await this.prismaService.parcel.findMany({
        where: { id: { in: parcelIds }, isDeleted: false },
        select: {
          id: true,
          destinationLocation: true,
          destinationLatitude: true,
          destinationLongitude: true,
        },
      });

      // Update each parcel individually
      for (const parcel of parcels) {
        await this.prismaService.parcel.update({
          where: { id: parcel.id },
          data: {
            status: 'DELIVERED',
            currentLocation: parcel.destinationLocation,
            currentLatitude: parcel.destinationLatitude,
            currentLongitude: parcel.destinationLongitude,
            updatedAt: new Date(),
          },
        });
      }
      return {
        message: `Updated ${parcels.length} parcels`,
        updatedCount: parcels.length,
      };
    }

    const updated = await this.prismaService.parcel.updateMany({
      where: { id: { in: parcelIds }, isDeleted: false },
      data: {
        status: status as (typeof PARCEL_STATUS)[keyof typeof PARCEL_STATUS],
      },
    });
    return {
      message: `Updated ${updated.count} parcels`,
      updatedCount: updated.count,
    };
  }

  async deleteParcel(parcelId: string) {
    const parcel = await this.prismaService.parcel.findFirst({
      where: {
        id: parcelId,
        isDeleted: false,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException(RESPONSE_MESSAGES.PARCEL_NOT_FOUND);
    }

    try {
      // Soft delete: set isDeleted true, set deletedAt
      await this.prismaService.parcel.update({
        where: { id: parcelId },
        data: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() },
      });

      return CommonHelpers.createResponse(
        true,
        RESPONSE_MESSAGES.PARCEL_DELETED,
      );
    } catch (error) {
      this.logger.error('Failed to delete parcel:', error);
      throw new BadRequestException('Failed to delete parcel');
    }
  }

  async searchParcels(
    query: ParcelQueryDto,
    userId?: string,
    userEmail?: string,
    isAdmin?: boolean,
  ) {
    const {
      status,
      trackingNumber,
      senderId,
      receiverId,
      receiverEmail,
      page = 1,
      limit = 10,
    } = query;

    // Page and limit are numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) || 1 : page;
    const limitNum =
      typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit;
    const skip = (pageNum - 1) * limitNum;

    const whereClause: Record<string, any> = {
      isDeleted: false,
    };

    if (status) {
      whereClause.status = status;
    }
    if (trackingNumber) {
      whereClause.trackingNumber = trackingNumber;
    }

    if (senderId) {
      whereClause.senderId = senderId;
    }
    if (receiverId && receiverEmail) {
      whereClause.OR = [{ receiverId }, { receiver: { email: receiverEmail } }];
    } else if (receiverId) {
      whereClause.receiverId = receiverId;
    } else if (receiverEmail) {
      whereClause.receiver = { email: receiverEmail };
    }

    // Add user ownership filter for non-admins
    if (!isAdmin) {
      if (userId) {
        whereClause.OR = [
          { senderId: userId },
          { receiverId: userId },
          { receiver: { email: userEmail } },
        ];
      }
    }

    const [parcels, total] = await Promise.all([
      this.prismaService.parcel.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.parcel.count({
        where: whereClause,
      }),
    ]);

    const sanitizeUser = (
      user:
        | {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: string;
            profileImage?: string | null;
            createdAt: Date;
            updatedAt: Date;
          }
        | undefined,
    ) => {
      if (!user) return undefined;
      const {
        id,
        firstName,
        lastName,
        email,
        phone,
        role,
        profileImage,
        createdAt,
        updatedAt,
      } = user;
      return {
        id,
        firstName,
        lastName,
        email,
        phone,
        role,
        profileImage,
        createdAt,
        updatedAt,
      };
    };

    const sanitizedParcels = parcels.map((parcel) => ({
      ...parcel,
      sender: sanitizeUser(parcel.sender),
      receiver: sanitizeUser(parcel.receiver),
    }));

    return CommonHelpers.createResponse(
      true,
      RESPONSE_MESSAGES.PARCELS_FETCHED,
      {
        parcels: sanitizedParcels,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    );
  }

  async trackParcelByNumber(trackingNumber: string) {
    const parcel = await this.prismaService.parcel.findFirst({
      where: {
        trackingNumber,
        isDeleted: false,
      },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!parcel) {
      throw new NotFoundException(RESPONSE_MESSAGES.PARCEL_NOT_FOUND);
    }

    // Sanitize user data
    const sanitizeUser = (
      user:
        | {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string | null;
            role: string;
            profileImage?: string | null;
            createdAt: Date;
            updatedAt: Date;
          }
        | undefined,
    ) => {
      if (!user) return undefined;
      const {
        id,
        firstName,
        lastName,
        email,
        phone,
        role,
        profileImage,
        createdAt,
        updatedAt,
      } = user;
      return {
        id,
        firstName,
        lastName,
        email,
        phone,
        role,
        profileImage,
        createdAt,
        updatedAt,
      };
    };

    // Determine route endpoints based on status
    const routeStart = parcel.pickupLocation;
    let routeEnd = parcel.destinationLocation;
    if (parcel.status === 'IN_TRANSIT' || parcel.status === 'PICKED_UP') {
      routeEnd = parcel.currentLocation || parcel.pickupLocation;
    }

    // Fetch route polyline from Google Maps Directions API
    let routePolyline: [number, number][] = [];
    try {
      const routeResult = await this.mapsService.getRoutePolyline(
        routeStart,
        routeEnd,
      );
      routePolyline = routeResult.polyline;
    } catch (error) {
      this.logger.warn('Failed to fetch route polyline:', error.message);
    }

    const sanitizedParcel = {
      ...parcel,
      sender: sanitizeUser(parcel.sender),
      receiver: sanitizeUser(parcel.receiver),
      routePolyline,
    };

    return CommonHelpers.createResponse(
      true,
      'Tracking information retrieved successfully',
      sanitizedParcel,
    );
  }

  private async notifySenderAndReceiver(parcel: {
    sender: { email: string };
    receiver: { email: string };
    trackingNumber: string;
    [key: string]: any;
  }) {
    try {
      await this.emailService.sendParcelStatusUpdate(
        parcel.sender.email,
        parcel,
      );
      await this.emailService.sendParcelStatusUpdate(
        parcel.receiver.email,
        parcel,
      );
      this.logger.log(`Notifications sent for parcel ${parcel.trackingNumber}`);
    } catch (error) {
      this.logger.error('Failed to send parcel notifications:', error);
    }
  }
}
