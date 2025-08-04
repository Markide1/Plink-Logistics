import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { UserRole, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto, userId: string) {
    // Verify the parcel exists and belongs to the user
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: createPaymentDto.parcelId },
      include: { sender: true },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    if (parcel.senderId !== userId) {
      throw new ForbiddenException(
        'You can only create payments for your own parcels',
      );
    }

    // Check if payment already exists for this parcel
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        parcelId: createPaymentDto.parcelId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Payment already exists for this parcel');
    }

    // Create the payment
    return this.prisma.payment.create({
      data: {
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
      },
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
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
        },
      },
    });
  }

  async findAll(userId?: string, userRole?: UserRole) {
    const where =
      userRole === UserRole.ADMIN
        ? {}
        : {
            parcel: {
              senderId: userId,
            },
          };

    return this.prisma.payment.findMany({
      where,
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            pickupLocation: true,
            destinationLocation: true,
            senderId: true,
            receiverId: true,
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
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only allow users to view their own payments unless they're admin
    if (userRole !== UserRole.ADMIN && payment.parcel.senderId !== userId) {
      throw new ForbiddenException('You can only view your own payments');
    }

    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
    userId?: string,
    userRole?: UserRole,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { parcel: { include: { sender: true } } },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only allow users to update their own payments or admins to update any
    if (userRole !== UserRole.ADMIN && payment.parcel.senderId !== userId) {
      throw new ForbiddenException('You can only update your own payments');
    }

    // Prevent updating completed payments
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot update completed payment');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: updatePaymentDto,
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
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
        },
      },
    });

    // If payment is marked as completed, update parcel status if needed
    if (
      updatePaymentDto.status === PaymentStatus.COMPLETED &&
      payment.parcel.status === 'PENDING'
    ) {
      await this.prisma.parcel.update({
        where: { id: payment.parcelId },
        data: { status: 'PICKED_UP' },
      });
    }

    return updatedPayment;
  }

  async remove(id: string, userId?: string, userRole?: UserRole) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { parcel: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Only allow users to delete their own payments or admins to delete any
    if (userRole !== UserRole.ADMIN && payment.parcel.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own payments');
    }

    // Prevent deleting completed payments
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed payment');
    }

    return this.prisma.payment.delete({
      where: { id },
    });
  }

  async processPayment(id: string, transactionRef: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { parcel: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is not in pending status');
    }

    // Update payment status to completed
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.COMPLETED,
        externalPaymentRef: transactionRef,
        processedAt: new Date(),
      },
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
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
        },
      },
    });

    // Update parcel status to PICKED_UP if it's still pending
    if (payment.parcel.status === 'PENDING') {
      await this.prisma.parcel.update({
        where: { id: payment.parcelId },
        data: { status: 'PICKED_UP' },
      });
    }

    return updatedPayment;
  }

  async getUserPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: { parcel: { senderId: userId } },
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentsByStatus(
    status: PaymentStatus,
    userRole?: UserRole,
    userId?: string,
  ) {
    const where =
      userRole === UserRole.ADMIN
        ? { status }
        : { status, parcel: { senderId: userId } };

    return this.prisma.payment.findMany({
      where,
      include: {
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
