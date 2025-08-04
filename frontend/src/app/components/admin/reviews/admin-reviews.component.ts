import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConfirmationDialogComponent } from '../../ui/confirmation-dialog/confirmation-dialog.component';
import { DeleteConfirmationComponent } from '../../ui/delete-confirmation/delete-confirmation';
import { Subscription } from 'rxjs';
import { ParcelService } from '../../../services/parcel.service';
import { NotificationService } from '../../../services/notification.service';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  parcel: {
    id: string;
    trackingNumber: string;
    description: string;
    status: string;
    sender: {
      id: string;
      name: string;
      email: string;
    };

    receiver: {
      id: string;
      name: string;
      email: string;
    };
  };
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReviewFilter {
  search: string;
  rating: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Array<{ stars: number; count: number; percentage: number }>;
  monthlyReviews: Array<{ month: string; count: number; avgRating: number }>;
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
imports: [CommonModule, FormsModule, RouterModule, ConfirmationDialogComponent, DeleteConfirmationComponent],
  templateUrl: './admin-reviews.html',
  styleUrls: ['./admin-reviews.scss']
})
export class AdminReviewsComponent implements OnInit, OnDestroy {
  protected readonly isLoading = signal(false);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly reviewStats = signal<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: [],
    monthlyReviews: []
  });
  protected readonly selectedReview = signal<Review | null>(null);
  protected readonly showDetailsModal = signal(false);

  protected filters: ReviewFilter = {
    search: '',
    rating: 'ALL',
    dateFrom: '',
    dateTo: '',
    status: 'ALL'
  };

  protected readonly ratingOptions = [
    { value: 'ALL', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' }
  ];

  protected readonly statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending Response' },
    { value: 'REVIEWED', label: 'Reviewed' },
    { value: 'FLAGGED', label: 'Flagged' }
  ];

  public Math = Math;
  private currentPage = 1;
  private readonly pageSize = 10;
  private subscriptions = new Subscription();

  constructor(
    private parcelService: ParcelService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadReviews();
    this.loadReviewStats();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadReviews() {
    this.isLoading.set(true);

    const reviewsSub = this.parcelService.getAllReviews(this.currentPage, this.pageSize, this.filters).subscribe({
      next: (response) => {
        let data: any[] = [];
        // Accept both { data: [...] } and [...] formats
        if (Array.isArray(response?.data)) {
          data = response.data;
        } else if (Array.isArray(response)) {
          data = response;
        } else if (response?.data && typeof response.data === 'object' && response.data.length >= 0) {
          data = response.data;
        } else if (Array.isArray(response?.reviews)) {
          data = response.reviews;
        }
        // Map backend review fields to expected frontend format
        const mapped = data.map((review: any) => ({
          id: String(review.id ?? ''),
          rating: Number(review.rating ?? 0),
          comment: String(review.comment ?? review.content ?? ''),
          createdAt: String(review.createdAt ?? ''),
          updatedAt: String(review.updatedAt ?? ''),
          parcel: {
            id: String(review.parcel?.id ?? ''),
            trackingNumber: String(review.parcel?.trackingNumber ?? ''),
            description: String(review.parcel?.description ?? ''),
            status: String(review.parcel?.status ?? ''),
            sender: {
              id: String(review.parcel?.sender?.id ?? ''),
              name:
                review.parcel?.sender?.name ??
                `${review.parcel?.sender?.firstName ?? ''} ${review.parcel?.sender?.lastName ?? ''}`.trim(),
              email: String(review.parcel?.sender?.email ?? ''),
            },
            receiver: {
              id: String(review.parcel?.receiver?.id ?? ''),
              name:
                review.parcel?.receiver?.name ??
                `${review.parcel?.receiver?.firstName ?? ''} ${review.parcel?.receiver?.lastName ?? ''}`.trim(),
              email: String(review.parcel?.receiver?.email ?? ''),
            },
          },
          reviewer: review.reviewer
            ? {
                id: String(review.reviewer.id ?? ''),
                name:
                  review.reviewer.name ??
                  `${review.reviewer.firstName ?? ''} ${review.reviewer.lastName ?? ''}`.trim(),
                email: String(review.reviewer.email ?? ''),
              }
            : review.user
            ? {
                id: String(review.user.id ?? ''),
                name:
                  review.user.name ??
                  `${review.user.firstName ?? ''} ${review.user.lastName ?? ''}`.trim(),
                email: String(review.user.email ?? ''),
              }
            : {
                id: '',
                name: '',
                email: '',
              },
        }));
        this.reviews.set(mapped);
        this.reviewStats.set({
          ...this.reviewStats(),
          totalReviews: mapped.length
        });
        this.isLoading.set(false);
      },
      error: (error: any) => {
        this.isLoading.set(false);
        if (error?.status === 403) {
          this.notificationService.showError('Access Denied', 'You must be logged in as an admin to view all reviews.');
        } else {
          this.notificationService.showError('Error', 'Failed to load reviews');
        }
        this.reviews.set([]);
      }
    });

    this.subscriptions.add(reviewsSub);
  }

  private loadReviewStats() {
    const statsSub = this.parcelService.getReviewStats().subscribe({
      next: (response) => {
        const stats = response.data || response;
        this.reviewStats.set({
          totalReviews: stats.totalReviews || 0,
          averageRating: stats.averageRating || 0,
          ratingDistribution: Array.isArray(stats.ratingDistribution) ? stats.ratingDistribution : [],
          monthlyReviews: Array.isArray(stats.monthlyReviews) ? stats.monthlyReviews : []
        });
      },
      error: (error: any) => {
        console.error('Error loading review stats:', error);
        this.notificationService.showError('Error', 'Failed to load review statistics');
      }
    });

    this.subscriptions.add(statsSub);
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadReviews();
  }

  onSearch() {
    this.currentPage = 1;
    this.loadReviews();
  }

  clearFilters() {
    this.filters = {
      search: '',
      rating: 'ALL',
      dateFrom: '',
      dateTo: '',
      status: 'ALL'
    };
    this.currentPage = 1;
    this.loadReviews();
  }

  viewReviewDetails(review: Review) {
    this.selectedReview.set(review);
    this.showDetailsModal.set(true);
  }

  openDeleteDialog(reviewId: string) {
    this.deleteReviewId = reviewId;
    this.showDeleteDialog = true;
    this.showDetailsModal.set(false);
    this.selectedReview.set(null);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedReview.set(null);
  }

  // State for confirmation dialog
  showFlagDialog = false;
  flagReviewId: string | null = null;
  isFlagging = false;

  openFlagDialog(reviewId: string) {
    this.flagReviewId = reviewId;
    this.showFlagDialog = true;
  }

  confirmFlagReview() {
    if (!this.flagReviewId) return;
    this.isFlagging = true;
    const flagSub = this.parcelService.flagReview(this.flagReviewId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Review has been flagged for review');
        this.loadReviews();
        this.isFlagging = false;
        this.showFlagDialog = false;
        this.flagReviewId = null;
      },
      error: (error: any) => {
        console.error('Error flagging review:', error);
        this.notificationService.showError('Error', 'Failed to flag review');
        this.isFlagging = false;
        this.showFlagDialog = false;
        this.flagReviewId = null;
      }
    });
    this.subscriptions.add(flagSub);
  }

  cancelFlagReview() {
    this.showFlagDialog = false;
    this.flagReviewId = null;
    this.isFlagging = false;
  }

  // State for delete confirmation modal
  showDeleteDialog = false;
  deleteReviewId: string | null = null;
  isDeleting = false;

  confirmDeleteReview() {
    if (!this.deleteReviewId) return;
    this.isDeleting = true;
    const deleteSub = this.parcelService.deleteReview(this.deleteReviewId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Review has been deleted');
        this.loadReviews();
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.deleteReviewId = null;
      },
      error: (error: any) => {
        console.error('Error deleting review:', error);
        this.notificationService.showError('Error', 'Failed to delete review');
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.deleteReviewId = null;
      }
    });
    this.subscriptions.add(deleteSub);
  }

  cancelDeleteReview() {
    this.showDeleteDialog = false;
    this.deleteReviewId = null;
    this.isDeleting = false;
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getRatingColor(rating: number): string {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPercentage(value: number | undefined): string {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  }
}