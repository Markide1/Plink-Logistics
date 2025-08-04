/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { MapsService } from '../maps/maps.service';
import { CommonHelpers } from '../common/helpers';
import {
  CreateParcelRequestDto,
  UpdateParcelRequestStatusDto,
  ParcelRequestQueryDto,
  CreateParcelFromRequestDto,
} from './dto/parcel-request.dto';

@Injectable()
export class ParcelRequestsService {
  private readonly logger = new Logger(ParcelRequestsService.name);

  constructor(
    private prismaService: PrismaService,
    private emailService: EmailService,
    private mapsService: MapsService,
  ) {}

  async createParcelRequest(
    senderId: string,
    createParcelRequestDto: CreateParcelRequestDto,
  ) {
    const {
      receiverEmail,
      description,
      weight,
      pickupLocation,
      destinationLocation,
      requestedPickupDate,
      specialInstructions,
    } = createParcelRequestDto;

    // Check if receiver exists (optional - they can be created later)
    const receiver = await this.prismaService.user.findUnique({
      where: { email: receiverEmail },
    });

    // Check if sender is trying to send to themselves
    const sender = await this.prismaService.user.findUnique({
      where: { id: senderId },
    });

    if (sender?.email === receiverEmail) {
      throw new BadRequestException('You cannot send a parcel to yourself');
    }

    // Check if receiver is an admin (admins cannot receive parcels)
    if (receiver && receiver.role === 'ADMIN') {
      throw new BadRequestException('Cannot send parcels to admin accounts.');
    }

    try {
      // Create parcel request
      const parcelRequest = await this.prismaService.parcelRequest.create({
        data: {
          senderId,
          receiverEmail,
          receiverName: receiver
            ? `${receiver.firstName} ${receiver.lastName}`.trim()
            : '',
          description,
          weight,
          pickupLocation,
          destinationLocation,
          requestedPickupDate,
          specialInstructions,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Send notification to admins about new request
      await this.notifyAdminsOfNewRequest(parcelRequest);

      this.logger.log(`New parcel request created: ${parcelRequest.id}`);

      return CommonHelpers.createResponse(
        true,
        'Parcel request submitted successfully. An admin will review your request shortly.',
        {
          id: parcelRequest.id,
          sender: parcelRequest.senderId,
          receiverEmail: parcelRequest.receiverEmail,
          description: parcelRequest.description,
          weight: parcelRequest.weight,
          pickupLocation: parcelRequest.pickupLocation,
          destinationLocation: parcelRequest.destinationLocation,
          requestedPickupDate: parcelRequest.requestedPickupDate,
          specialInstructions: parcelRequest.specialInstructions,
          status: parcelRequest.status,
          createdAt: parcelRequest.createdAt,
        },
        201,
      );
    } catch (error) {
      this.logger.error('Failed to create parcel request:', error);
      throw new BadRequestException('Failed to create parcel request');
    }
  }

  async getParcelRequests(
    query: ParcelRequestQueryDto,
    userRole?: string,
    userId?: string,
  ) {
    const { status, senderId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isDeleted: false,
    };

    // Only set status if it's a valid value (not 'ALL', '', null, or undefined)
    if (status && status !== 'ALL' && status !== '') {
      whereClause.status = status;
    }

    // If user is not admin, only show their own requests
    if (userRole !== 'ADMIN') {
      whereClause.senderId = userId;
    } else if (senderId) {
      // Admin can filter by specific sender
      whereClause.senderId = senderId;
    }

    const [requests, total] = await Promise.all([
      this.prismaService.parcelRequest.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          createdParcels: {
            select: {
              id: true,
              trackingNumber: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.parcelRequest.count({
        where: whereClause,
      }),
    ]);

    return CommonHelpers.createResponse(
      true,
      'Parcel requests retrieved successfully',
      {
        requests,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    );
  }

  async getParcelRequestById(
    requestId: string,
    userRole?: string,
    userId?: string,
  ) {
    const request = await this.prismaService.parcelRequest.findFirst({
      where: {
        id: requestId,
        isDeleted: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        createdParcels: {
          include: {
            receiver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Parcel request not found');
    }

    // Check permissions: only admin or request owner can view
    if (userRole !== 'ADMIN' && request.senderId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this request',
      );
    }

    return CommonHelpers.createResponse(
      true,
      'Parcel request retrieved successfully',
      request,
    );
  }

  async updateParcelRequestStatus(
    requestId: string,
    updateParcelRequestStatusDto: UpdateParcelRequestStatusDto,
    adminId: string,
  ) {
    const { status, adminNotes } = updateParcelRequestStatusDto;

    const request = await this.prismaService.parcelRequest.findFirst({
      where: { id: requestId, isDeleted: false },
      include: { sender: true },
    });

    if (!request) {
      throw new NotFoundException('Parcel request not found');
    }

    try {
      const updatedRequest = await this.prismaService.parcelRequest.update({
        where: { id: requestId },
        data: {
          status: status as any,
          adminNotes,
          updatedAt: new Date(),
        },
        include: { sender: true },
      });

      // Send notification to sender about status update
      await this.notifySenderOfStatusUpdate(updatedRequest);

      if (status === 'REJECTED') {
        await this.emailService.sendParcelRequestRejectedEmail(
          request.sender.email,
          `${request.sender.firstName} ${request.sender.lastName}`,
          request.receiverEmail,
          request.description,
          request.weight,
          request.pickupLocation,
          request.destinationLocation,
          adminNotes,
        );
      }

      let createdParcel: any = undefined;
      if (status === 'APPROVED') {
        // Only create if not already created
        const existingParcels = await this.prismaService.parcel.findMany({
          where: { parcelRequestId: requestId, isDeleted: false },
        });
        if (existingParcels.length === 0) {
          // Use the same logic as createParcelFromRequest
          let receiver = await this.prismaService.user.findUnique({
            where: { email: request.receiverEmail },
          });

          if (!receiver) {
            const tempPassword = CommonHelpers.generateRandomString(12);
            const hashedTempPassword =
              await CommonHelpers.hashPassword(tempPassword);
            const tempPasswordExpiry = new Date();
            tempPasswordExpiry.setHours(tempPasswordExpiry.getHours() + 24);

            const firstName = 'User';
            const lastName = '';

            receiver = await this.prismaService.user.create({
              data: {
                email: request.receiverEmail,
                firstName,
                lastName,
                phone: '',
                password: hashedTempPassword,
                role: 'USER',
                tempPassword: hashedTempPassword,
                tempPasswordExpiry,
              },
            });

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
          }

          // Geocode pickup/destination if needed
          let finalPickupLatitude: number | undefined = undefined;
          let finalPickupLongitude: number | undefined = undefined;
          let finalPickupLocation = request.pickupLocation;
          try {
            const pickupGeocode = await this.mapsService.geocodeAddress(
              request.pickupLocation,
            );
            finalPickupLatitude = pickupGeocode.latitude;
            finalPickupLongitude = pickupGeocode.longitude;
            finalPickupLocation = pickupGeocode.formattedAddress;
          } catch (error) {
            this.logger.warn(
              `Failed to geocode pickup location: ${error.message}`,
            );
          }

          let finalDestinationLatitude: number | undefined = undefined;
          let finalDestinationLongitude: number | undefined = undefined;
          let finalDestinationLocation = request.destinationLocation;
          try {
            const destinationGeocode = await this.mapsService.geocodeAddress(
              request.destinationLocation,
            );
            finalDestinationLatitude = destinationGeocode.latitude;
            finalDestinationLongitude = destinationGeocode.longitude;
            finalDestinationLocation = destinationGeocode.formattedAddress;
          } catch (error) {
            this.logger.warn(
              `Failed to geocode destination location: ${error.message}`,
            );
          }

          const price = CommonHelpers.calculateParcelPrice(request.weight);
          const trackingNumber = CommonHelpers.generateTrackingNumber();

          createdParcel = await this.prismaService.parcel.create({
            data: {
              senderId: request.senderId,
              receiverId: receiver.id,
              description: request.description,
              weight: request.weight,
              price,
              pickupLocation: finalPickupLocation,
              pickupLatitude: finalPickupLatitude,
              pickupLongitude: finalPickupLongitude,
              destinationLocation: finalDestinationLocation,
              destinationLatitude: finalDestinationLatitude,
              destinationLongitude: finalDestinationLongitude,
              trackingNumber,
              parcelRequestId: requestId,
              status: 'PICKED_UP',
              currentLocation: finalPickupLocation,
              currentLatitude: finalPickupLatitude,
              currentLongitude: finalPickupLongitude,
            },
            include: {
              sender: true,
              receiver: true,
            },
          });

          // Send notifications
          await this.emailService.sendParcelStatusUpdate(
            request.sender.email,
            createdParcel,
          );
          await this.emailService.sendParcelStatusUpdate(
            receiver.email,
            createdParcel,
          );

          if (createdParcel) {
            this.logger.log(
              `Parcel auto-created from request ${requestId}: ${createdParcel.id}`,
            );
          }
        } else {
          createdParcel = existingParcels[0];
        }
      }

      return CommonHelpers.createResponse(
        true,
        `Parcel request status updated to ${status}` +
          (createdParcel ? ' and parcel created.' : ''),
        {
          request: updatedRequest,
          ...(createdParcel ? { parcel: createdParcel } : {}),
        },
      );
    } catch (error) {
      this.logger.error('Failed to update parcel request status:', error);
      throw new BadRequestException('Failed to update parcel request status');
    }
  }

  async createParcelFromRequest(
    createParcelFromRequestDto: CreateParcelFromRequestDto,
    // adminId: string, // Remove unused parameter
  ) {
    const {
      requestId,
      pickupLatitude,
      pickupLongitude,
      destinationLatitude,
      destinationLongitude,
    } = createParcelFromRequestDto;

    // Get the parcel request
    const request = await this.prismaService.parcelRequest.findFirst({
      where: {
        id: requestId,
        isDeleted: false,
        status: 'APPROVED',
      },
      include: {
        sender: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Approved parcel request not found');
    }

    // Check if receiver exists, create if not
    let receiver = await this.prismaService.user.findUnique({
      where: { email: request.receiverEmail },
    });

    if (!receiver) {
      // Generate temporary password
      const tempPassword = CommonHelpers.generateRandomString(12);
      const hashedTempPassword = await CommonHelpers.hashPassword(tempPassword);
      const tempPasswordExpiry = new Date();
      tempPasswordExpiry.setHours(tempPasswordExpiry.getHours() + 24); // 24 hours from now

      const firstName = 'User';
      const lastName = '';

      // Check if receiver exists, create if not, and set parcel status and location
      receiver = await this.prismaService.user.create({
        data: {
          email: request.receiverEmail,
          firstName,
          lastName,
          phone: '',
          password: hashedTempPassword,
          role: 'USER',
          tempPassword: hashedTempPassword, // Store hashed temp password separately
          tempPasswordExpiry,
        },
      });

      // Send credentials email to new user
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
    }

    try {
      // Geocode locations if coordinates not provided
      let finalPickupLatitude = pickupLatitude;
      let finalPickupLongitude = pickupLongitude;
      let finalPickupLocation = request.pickupLocation;

      if (!pickupLatitude || !pickupLongitude) {
        try {
          this.logger.log(
            `Geocoding pickup location: ${request.pickupLocation}`,
          );
          const pickupGeocode = await this.mapsService.geocodeAddress(
            request.pickupLocation,
          );
          finalPickupLatitude = pickupGeocode.latitude;
          finalPickupLongitude = pickupGeocode.longitude;
          finalPickupLocation = pickupGeocode.formattedAddress;
        } catch (error) {
          this.logger.warn(
            `Failed to geocode pickup location: ${error.message}`,
          );
        }
      }

      let finalDestinationLatitude = destinationLatitude;
      let finalDestinationLongitude = destinationLongitude;
      let finalDestinationLocation = request.destinationLocation;

      if (!destinationLatitude || !destinationLongitude) {
        try {
          this.logger.log(
            `Geocoding destination location: ${request.destinationLocation}`,
          );
          const destinationGeocode = await this.mapsService.geocodeAddress(
            request.destinationLocation,
          );
          finalDestinationLatitude = destinationGeocode.latitude;
          finalDestinationLongitude = destinationGeocode.longitude;
          finalDestinationLocation = destinationGeocode.formattedAddress;
        } catch (error) {
          this.logger.warn(
            `Failed to geocode destination location: ${error.message}`,
          );
        }
      }

      // Calculate price and tracking number
      const price = CommonHelpers.calculateParcelPrice(request.weight);
      const trackingNumber = CommonHelpers.generateTrackingNumber();

      // Create the parcel
      const parcel = await this.prismaService.parcel.create({
        data: {
          senderId: request.senderId,
          receiverId: receiver.id,
          description: request.description,
          weight: request.weight,
          price,
          pickupLocation: finalPickupLocation,
          pickupLatitude: finalPickupLatitude,
          pickupLongitude: finalPickupLongitude,
          destinationLocation: finalDestinationLocation,
          destinationLatitude: finalDestinationLatitude,
          destinationLongitude: finalDestinationLongitude,
          trackingNumber,
          parcelRequestId: requestId,
          status: 'PICKED_UP',
          currentLocation: finalPickupLocation,
          currentLatitude: finalPickupLatitude,
          currentLongitude: finalPickupLongitude,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      // Send notifications
      await this.emailService.sendParcelStatusUpdate(
        request.sender.email,
        parcel,
      );
      await this.emailService.sendParcelStatusUpdate(receiver.email, parcel);

      this.logger.log(`Parcel created from request ${requestId}: ${parcel.id}`);

      return CommonHelpers.createResponse(
        true,
        'Parcel created successfully from request',
        {
          parcel: {
            id: parcel.id,
            trackingNumber: parcel.trackingNumber,
            description: parcel.description,
            weight: parcel.weight,
            price: parcel.price,
            status: parcel.status,
            pickupLocation: parcel.pickupLocation,
            destinationLocation: parcel.destinationLocation,
            sender: {
              id: parcel.sender.id,
              firstName: parcel.sender.firstName,
              lastName: parcel.sender.lastName,
              email: parcel.sender.email,
            },
            receiver: {
              id: parcel.receiver.id,
              firstName: parcel.receiver.firstName,
              lastName: parcel.receiver.lastName,
              email: parcel.receiver.email,
            },
            createdAt: parcel.createdAt,
          },
        },
        201,
      );
    } catch (error) {
      this.logger.error('Failed to create parcel from request:', error);
      throw new BadRequestException('Failed to create parcel from request');
    }
  }

  async deleteParcelRequest(
    requestId: string,
    userId: string,
    userRole: string,
  ) {
    const request = await this.prismaService.parcelRequest.findFirst({
      where: {
        id: requestId,
        isDeleted: false,
      },
    });

    if (!request) {
      throw new NotFoundException('Parcel request not found');
    }

    // Only allow deletion of PENDING requests
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be deleted');
    }

    // Check permissions: only admin or request owner can delete
    if (userRole !== 'ADMIN' && request.senderId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this request',
      );
    }

    try {
      // Soft delete: set isDeleted true, set deletedAt
      await this.prismaService.parcelRequest.update({
        where: { id: requestId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return CommonHelpers.createResponse(
        true,
        'Parcel request deleted successfully',
      );
    } catch (error) {
      this.logger.error('Failed to delete parcel request:', error);
      throw new BadRequestException('Failed to delete parcel request');
    }
  }

  private async notifyAdminsOfNewRequest(request: any) {
    try {
      // Get all admin users
      const admins = await this.prismaService.user.findMany({
        where: {
          role: 'ADMIN',
          isDeleted: false,
        },
      });

      // Send notification to all admins
      for (const admin of admins) {
        await this.emailService.sendNewParcelRequestNotification(
          admin.email,
          request,
        );
      }
    } catch (error) {
      this.logger.error('Failed to notify admins of new request:', error);
    }
  }

  private async notifySenderOfStatusUpdate(request: any) {
    try {
      await this.emailService.sendParcelRequestStatusUpdate(
        request.sender.email,
        request,
      );
    } catch (error) {
      this.logger.error('Failed to notify sender of status update:', error);
    }
  }
}
