import { NotificationService } from './../../../services/notification.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  ParcelService,
  Parcel,
  PaginatedResponse,
} from '../../../services/parcel.service';
import { Subscription } from 'rxjs';
import { SendParcelComponent } from './send-parcel.component';
import { interval } from 'rxjs';
import { User } from '../../../models/types';
import { Store } from '@ngrx/store';
import { selectUser } from '../../../store/auth/auth.selectors';

@Component({
selector: 'app-user-parcels',
standalone: true,
imports: [CommonModule, FormsModule, RouterModule, SendParcelComponent],
templateUrl: './user-parcels.html',
styleUrls: ['./user-parcels.scss'],
})

export class UserParcelsComponent implements OnInit, OnDestroy {
  activeTab: 'sent' | 'received' = 'sent';
  isLoading = false;
  sentParcels: PaginatedResponse<Parcel> = {
    data: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };
  receivedParcels: PaginatedResponse<Parcel> = {
    data: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };

  showSubmitParcelModal = false;
  showDetailsModal = false;
  selectedParcel: Parcel | null = null;
  pollingSub: Subscription | null = null;

  private currentSentPage = 1;
  private currentReceivedPage = 1;
  private subscriptions: Array<Subscription & { name?: string }> = [];

  user: User | null = null;
  userSub: Subscription | null = null;

  sentLoaded = false;
  receivedLoaded = false;

  constructor(
    private parcelService: ParcelService,
    private router: Router,
    private notificationService: NotificationService,
    private store: Store
  ) {
    this.userSub = this.store.select(selectUser).subscribe(user => {
      this.user = user;
      if (user) {
        this.loadParcelsForActiveTab();
      }
    });
  }

  


  openSubmitParcelModal(): void {
    this.showSubmitParcelModal = true;
  }

  closeSubmitParcelModal(): void {
    this.showSubmitParcelModal = false;
  }

  onParcelSubmit(): void {
    this.closeSubmitParcelModal();
    this.loadSentParcels();
    this.notificationService.showSuccess(
      'Parcel submitted!',
      'Wait for transport information'
    );
  }

  setTab(tab: 'sent' | 'received') {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    if (this.activeTab === 'sent') {
      this.currentSentPage = 1;
      this.loadSentParcels();
    } else {
      this.currentReceivedPage = 1;
      this.loadReceivedParcels();
    }
  }


  ngOnInit() {
    this.loadSentParcels();
    this.loadReceivedParcels();
    this.pollingSub = interval(10000).subscribe(() => {
      this.loadSentParcels();
      this.loadReceivedParcels();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    if (this.pollingSub) this.pollingSub.unsubscribe();
    if (this.userSub) this.userSub.unsubscribe();
  }
  openDetailsModal(parcel: Parcel) {
    (parcel as any).reviews = [];
    (parcel as any).reviewed = false;
    this.selectedParcel = parcel;
    this.showDetailsModal = true;
  }

  getSenderName(parcel: Parcel): string {
    if (parcel.sender) {
      return `${parcel.sender.firstName} ${parcel.sender.lastName}`.trim();
    }
    return 'Unknown Sender';
  }

  getReceiverName(parcel: Parcel): string {
    if (parcel.receiver) {
      return `${parcel.receiver.firstName} ${parcel.receiver.lastName}`.trim();
    }
    return 'Unknown Receiver';
  }

  getCourierName(parcel: Parcel): string {
    if (parcel.courier) {
      return `${parcel.courier.firstName} ${parcel.courier.lastName}`.trim();
    }
    return 'Not assigned';
  }

  getReviewUserName(review: any): string {
    if (review?.user) {
      return `${review.user.firstName} ${review.user.lastName}`.trim();
    }
    return 'Anonymous';
  }

  closeDetailsModal() {
    this.selectedParcel = null;
    this.showDetailsModal = false;
  }

  markAsReceived(parcelId: string) {
    this.parcelService.markAsReceived(parcelId).subscribe({
      next: () => {
        this.loadReceivedParcels();
        // Optionally update selectedParcel status for immediate UI feedback
        if (this.selectedParcel && this.selectedParcel.id === parcelId) {
          this.selectedParcel.status = 'RECEIVED';
        }
        this.closeDetailsModal();
        this.notificationService.showSuccess('Parcel marked as received!', 'You can now review this parcel.');
      },
      error: () => {
        this.notificationService.showError('Failed to mark as received.', 'Please try again.');
      }
    });
  }

  openReviewModal(parcel: Parcel) {
    // Implement review modal logic or navigation
    // For now, navigate to review page, then update reviewed status after review
    this.reviewParcel(parcel.id);
    // Optionally, after review, set reviewed to true for immediate UI feedback
    if (this.selectedParcel && this.selectedParcel.id === parcel.id) {
      (this.selectedParcel as any).reviewed = true;
    }
  }

  /**
   * Returns true if the parcel can be reviewed (only RECEIVED and not reviewed)
   */
  canReviewParcel(parcel: Parcel): boolean {
    return parcel.status === 'RECEIVED' && !parcel.reviewed;
  }

  private loadParcelsForActiveTab(): void {
    if (this.activeTab === 'sent') {
      this.loadSentParcels();
    } else {
      this.loadReceivedParcels();
    }
  }

  private loadSentParcels() {
    if (!this.user) return;
    const existingSentSub = this.subscriptions.find(
      (sub) => sub.name === 'sentParcelsSub'
    );
    if (existingSentSub) {
      existingSentSub.unsubscribe();
      this.subscriptions = this.subscriptions.filter((sub) => sub.name !== 'sentParcelsSub');
    }

    const sentSub = this.parcelService
      .getUserSentParcels(this.currentSentPage, this.sentParcels.pageSize, this.user.id)
      .subscribe({
        next: (response) => {
          let parcels: Parcel[] = [];
          if (response && typeof response === 'object' && 'data' in response) {
            if (Array.isArray(response.data)) {
              parcels = response.data;
            } else if (
              response.data &&
              typeof response.data === 'object' &&
              'parcels' in response.data &&
              Array.isArray((response.data as { parcels: Parcel[] }).parcels)
            ) {
              parcels = (response.data as { parcels: Parcel[] }).parcels;
            }
          } else if (response && typeof response === 'object' && 'parcels' in response && Array.isArray((response as any).parcels)) {
            parcels = (response as any).parcels;
          }
          // Only show parcels sent by the current user
          parcels = parcels.filter(parcel => parcel.sender?.id === this.user?.id);
          this.sentParcels = {
            ...this.sentParcels,
            data: parcels,
            totalCount: parcels.length,
            totalPages: Math.ceil(parcels.length / this.sentParcels.pageSize),
            currentPage: this.currentSentPage,
            hasNext: false,
            hasPrevious: false,
          };
          this.sentLoaded = true;
          localStorage.setItem('sentParcels', JSON.stringify(this.sentParcels));
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading sent parcels:', err);
          this.isLoading = false;
          this.sentLoaded = true;
          this.notificationService.showError(
            'Failed to load sent parcels.',
            'Please try again.'
          );
        },
      }) as Subscription & { name?: string };
    sentSub.name = 'sentParcelsSub';
    this.subscriptions.push(sentSub);
  }

  private loadReceivedParcels() {
    if (!this.user) {
      this.receivedParcels = {
        data: [],
        totalCount: 0,
        currentPage: 1,
        pageSize: 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
      this.receivedLoaded = true;
      return;
    }
    const existingReceivedSub = this.subscriptions.find(
      (sub) => sub.name === 'receivedParcelsSub'
    );
    if (existingReceivedSub) {
      existingReceivedSub.unsubscribe();
      this.subscriptions = this.subscriptions.filter((sub) => sub.name !== 'receivedParcelsSub');
    }

    this.isLoading = true;
    const receivedSub = this.parcelService
      .getUserReceivedParcels(
        this.currentReceivedPage,
        this.receivedParcels.pageSize,
        this.user.id,
        this.user.email
      )
      .subscribe({
        next: (response: any) => {
          let parcels: Parcel[] = [];
          let dataBlock = response;
          if (response && typeof response === 'object' && 'data' in response && response.data) {
            dataBlock = response.data;
          }
          if (dataBlock && Array.isArray(dataBlock.parcels)) {
            parcels = dataBlock.parcels;
          } else if (dataBlock && Array.isArray(dataBlock.data)) {
            parcels = dataBlock.data;
          }
          // Only show parcels received by the current user
          parcels = parcels.filter(parcel => parcel.receiver?.id === this.user?.id || parcel.receiver?.email === this.user?.email);
          this.receivedParcels = {
            ...this.receivedParcels,
            data: parcels,
            totalCount: parcels.length,
            totalPages: Math.ceil(parcels.length / this.receivedParcels.pageSize),
            currentPage: this.currentReceivedPage,
            hasNext: false,
            hasPrevious: false,
          };
          this.receivedLoaded = true;
          localStorage.setItem('receivedParcels', JSON.stringify(this.receivedParcels));
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading received parcels:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Full error object:', err);
          this.receivedParcels = {
            ...this.receivedParcels,
            data: [],
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            hasNext: false,
            hasPrevious: false,
          };
          this.isLoading = false;
          this.receivedLoaded = true;
          if (err.status === 401) {
            this.notificationService.showError(
              'Authentication required.',
              'Please log in again.'
            );
          } else {
            this.notificationService.showError(
              'Failed to load received parcels.',
              'Please try again.'
            );
          }
        },
      }) as Subscription & { name?: string };
    receivedSub.name = 'receivedParcelsSub';
    this.subscriptions.push(receivedSub);
  }
  nextPage(type: 'sent' | 'received') {
    if (type === 'sent' && this.sentParcels.hasNext) {
      this.currentSentPage++;
      this.loadSentParcels();
    } else if (type === 'received' && this.receivedParcels.hasNext) {
      this.currentReceivedPage++;
      this.loadReceivedParcels();
    }
  }

  previousPage(type: 'sent' | 'received') {
    if (type === 'sent' && this.sentParcels.hasPrevious) {
      this.currentSentPage--;
      this.loadSentParcels();
    } else if (type === 'received' && this.receivedParcels.hasPrevious) {
      this.currentReceivedPage--;
      this.loadReceivedParcels();
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PICKED_UP':
        return 'bg-indigo-100 text-indigo-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'RECEIVED':
        return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'RECEIVED':
        return 'Received';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return 'Invalid Date';
    }
  }

  viewParcelDetails(parcelId: string) {
    this.router.navigate(['/dashboard/user/parcels', parcelId]);
  }

  reviewParcel(parcelId: string) {
    this.router.navigate(['/dashboard/user/reviews', parcelId]);
  }

  trackReview(index: number, review: any): any {
    return review?.id || index;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }
}

