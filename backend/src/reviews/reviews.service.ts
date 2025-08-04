import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // Helper to extract userId from user object
  private extractUserId(
    user: { id?: string; sub?: string } | string | number,
  ): string {
    if (typeof user === 'string' || typeof user === 'number') {
      return String(user);
    } else if (user) {
      if (typeof user.sub === 'string' || typeof user.sub === 'number') {
        return String(user.sub);
      } else if (typeof user.id === 'string' || typeof user.id === 'number') {
        return String(user.id);
      }
    }
    throw new BadRequestException(
      'Invalid user information: JWT payload missing sub or id',
    );
  }

  async create(
    user: { id?: string; sub?: string } | string | number,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const userId = this.extractUserId(user);
    const parcel = await this.prisma.parcel.findUnique({
      where: { id: createReviewDto.parcelId },
    });

    if (!parcel) {
      throw new NotFoundException('Parcel not found');
    }

    if (parcel.status !== 'RECEIVED') {
      throw new BadRequestException(
        'Cannot review a parcel that is not marked as RECEIVED',
      );
    }

    // Only allow the receiver to review
    if (parcel.receiverId !== userId) {
      throw new ForbiddenException('Only the receiver can review this parcel');
    }

    // Check for duplicate review
    const existingReview = await this.prisma.review.findFirst({
      where: { userId, parcelId: createReviewDto.parcelId },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this parcel');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        parcelId: createReviewDto.parcelId,
        content: createReviewDto.content,
        rating: createReviewDto.rating,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            description: true,
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
    });

    return {
      id: review.id,
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
      parcel: review.parcel,
    };
  }

  async findAll(isAdmin: boolean = false): Promise<ReviewResponseDto[]> {
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can view all reviews');
    }
    // Only used for admin endpoint
    const reviews = await this.prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            description: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
      parcel: review.parcel,
    }));
  }

  async findByUser(
    user: { id?: string; sub?: string } | string | number,
  ): Promise<ReviewResponseDto[]> {
    const userId = this.extractUserId(user);
    // Only return reviews where userId matches
    const reviews = await this.prisma.review.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            description: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews.map((review) => ({
      id: review.id,
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
      parcel: review.parcel,
    }));
  }

  async findOne(
    id: string,
    userId?: string,
    isAdmin?: boolean,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            description: true,
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
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only owner or admin can access
    if (!isAdmin && userId && review.user.id !== userId) {
      throw new ForbiddenException('You do not have access to this review');
    }

    return {
      id: review.id,
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
      parcel: review.parcel,
    };
  }

  async update(
    id: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    // First check if the review exists
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Check if the user owns the review
    if (existingReview.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const review = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            profileImage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        parcel: {
          select: {
            id: true,
            trackingNumber: true,
            description: true,
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
    });

    return {
      id: review.id,
      content: review.content,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: review.user,
      parcel: review.parcel,
    };
  }

  async remove(
    id: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<void> {
    // First check if the review exists
    const existingReview = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      throw new NotFoundException('Review not found');
    }

    // Check if the user owns the review or is an admin
    if (!isAdmin && existingReview.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });
  }

  async getAverageRating(): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const result = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.id,
    };
  }
}
