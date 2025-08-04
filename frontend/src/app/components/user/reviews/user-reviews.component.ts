import { Component, OnInit } from '@angular/core';
import { ParcelService, Parcel } from '../../../services/parcel.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, getUserName } from '../../../models/types';

interface Review {
  id: string;
  rating: number;
  content?: string | null;
  createdAt: string;
  parcel: Parcel;
}

@Component({
  selector: 'app-user-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-reviews.html',
  styleUrls: ['./user-reviews.scss'],
})
export class UserReviewsComponent implements OnInit {
  activeTab: 'pending' | 'submitted' = 'pending';
  isLoading = false;
  isSubmittingReview = false;
  pendingReviews: Parcel[] = [];
  submittedReviews: Review[] = [];
  reviewedParcelIds: Set<string> = new Set();
  reviewRatings: { [key: string]: number } = {};
  reviewContents: { [key: string]: string } = {};

  constructor(private parcelService: ParcelService) {}

  ngOnInit() {
    this.isLoading = true;
    Promise.all([
      this.parcelService.getUserReceivedParcels(1, 100).toPromise(),
      this.parcelService.getMyReviews(1, 100).toPromise(),
    ])
      .then(([receivedParcelsRes, myReviewsRes]) => {
        let parcels: Parcel[] = [];
        let currentUserId = ''; // Add this line

        // Extract received parcels
        if (
          receivedParcelsRes &&
          typeof receivedParcelsRes === 'object' &&
          'data' in receivedParcelsRes
        ) {
          if (Array.isArray(receivedParcelsRes.data)) {
            parcels = receivedParcelsRes.data;
          } else if (
            receivedParcelsRes.data &&
            typeof receivedParcelsRes.data === 'object' &&
            'parcels' in receivedParcelsRes.data &&
            Array.isArray(
              (receivedParcelsRes.data as { parcels: Parcel[] }).parcels
            )
          ) {
            parcels = (receivedParcelsRes.data as { parcels: Parcel[] }).parcels;
          }
        } else if (
          receivedParcelsRes &&
          typeof receivedParcelsRes === 'object' &&
          'parcels' in receivedParcelsRes &&
          Array.isArray((receivedParcelsRes as any).parcels)
        ) {
          parcels = (receivedParcelsRes as any).parcels;
        }

        // Get current user ID from one of the parcels (all should have same receiver)
        if (parcels.length > 0 && parcels[0].receiver && parcels[0].receiver.id) {
          currentUserId = parcels[0].receiver.id;
        }

        // Extract submitted reviews
        let reviews: Review[] = [];
        if (
          myReviewsRes &&
          typeof myReviewsRes === 'object' &&
          'data' in myReviewsRes &&
          Array.isArray(myReviewsRes.data)
        ) {
          reviews = myReviewsRes.data.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            content: r.content ?? r.comment ?? '',
            createdAt: r.createdAt,
            parcel: r.parcel,
          }));
        }

        // Build set of reviewed parcel IDs
        this.reviewedParcelIds = new Set(reviews.map(r => r.parcel?.id));

        // Only allow reviewing parcels received by the current user
        this.pendingReviews = parcels.filter(
          p =>
            p.receiver?.id === currentUserId &&
            (p.status === 'RECEIVED' || p.status === 'DELIVERED') &&
            !this.reviewedParcelIds.has(p.id)
        );

        // Set submitted reviews
        this.submittedReviews = reviews;

        // Initialize review ratings/contents for pending parcels only
        this.reviewRatings = {};
        this.reviewContents = {};
        this.pendingReviews.forEach(p => {
          this.reviewRatings[p.id] = 0;
          this.reviewContents[p.id] = '';
        });

        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
        this.pendingReviews = [];
        this.submittedReviews = [];
      });
  }

  setTab(tab: 'pending' | 'submitted') {
    this.activeTab = tab;
  }

  setRating(parcelId: string, rating: number) {
    this.reviewRatings[parcelId] = rating;
  }

  setComment(parcelId: string, event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.reviewContents[parcelId] = target.value;
  }

  submitReview(parcelId: string) {
    const rating = this.reviewRatings[parcelId];
    const content = this.reviewContents[parcelId];

    if (!rating) return;

    this.isSubmittingReview = true;

    this.parcelService.addReview(parcelId, rating, content).subscribe({
      next: () => {
        delete this.reviewRatings[parcelId];
        delete this.reviewContents[parcelId];
        this.isSubmittingReview = false;
        this.refreshReviews();
      },
      error: () => {
        this.isSubmittingReview = false;
      },
    });
  }

  private refreshReviews() {
    this.isLoading = true;
    Promise.all([
      this.parcelService.getUserReceivedParcels(1, 100).toPromise(),
      this.parcelService.getMyReviews(1, 100).toPromise(),
    ])
      .then(([receivedParcelsRes, myReviewsRes]) => {
        let parcels: Parcel[] = [];
        let reviews: Review[] = [];
        // Extract received parcels
        if (
          receivedParcelsRes &&
          typeof receivedParcelsRes === 'object' &&
          'data' in receivedParcelsRes
        ) {
          if (Array.isArray(receivedParcelsRes.data)) {
            parcels = receivedParcelsRes.data;
          } else if (
            receivedParcelsRes.data &&
            typeof receivedParcelsRes.data === 'object' &&
            'parcels' in receivedParcelsRes.data &&
            Array.isArray(
              (receivedParcelsRes.data as { parcels: Parcel[] }).parcels
            )
          ) {
            parcels = (receivedParcelsRes.data as { parcels: Parcel[] }).parcels;
          }
        } else if (
          receivedParcelsRes &&
          typeof receivedParcelsRes === 'object' &&
          'parcels' in receivedParcelsRes &&
          Array.isArray((receivedParcelsRes as any).parcels)
        ) {
          parcels = (receivedParcelsRes as any).parcels;
        }

        // Extract submitted reviews
        if (
          myReviewsRes &&
          typeof myReviewsRes === 'object' &&
          'data' in myReviewsRes &&
          Array.isArray(myReviewsRes.data)
        ) {
          reviews = myReviewsRes.data.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            content: r.content ?? r.comment ?? '',
            createdAt: r.createdAt,
            parcel: r.parcel,
          }));
        }

        // Build set of reviewed parcel IDs
        this.reviewedParcelIds = new Set(reviews.map(r => r.parcel?.id));

        // Only allow reviewing parcels received by the current user
        this.pendingReviews = parcels.filter(
          p =>
            (p.status === 'RECEIVED' || p.status === 'DELIVERED') &&
            !this.reviewedParcelIds.has(p.id)
        );

        // Set submitted reviews
        this.submittedReviews = reviews;

        // Initialize review ratings/contents for pending parcels only
        this.reviewRatings = {};
        this.reviewContents = {};
        this.pendingReviews.forEach(p => {
          this.reviewRatings[p.id] = 0;
          this.reviewContents[p.id] = '';
        });

        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
        this.pendingReviews = [];
        this.submittedReviews = [];
      });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getSenderName(user: User): string { 
        return getUserName(user);
  }
}
