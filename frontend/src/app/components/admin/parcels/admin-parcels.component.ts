import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ParcelService, Parcel, BackendResponse, PaginatedData } from '../../../services/parcel.service';
import { ParcelRequestService, ParcelRequest } from '../../../services/parcel-request.service';
import { NotificationService } from '../../../services/notification.service';
import { DeleteConfirmationComponent } from '../../ui/delete-confirmation/delete-confirmation';

@Component({
  selector: 'app-admin-parcels',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DeleteConfirmationComponent],
  templateUrl: './admin-parcels.html',
  styleUrls: ['./admin-parcels.scss']
})

export class AdminParcelsComponent implements OnInit, OnDestroy {
  public filters = {
    status: 'ALL',
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    pageSize: 10
  };

  // Status options for dropdown
  public statusOptions = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'PICKED_UP', label: 'Picked Up', color: 'bg-blue-100 text-blue-800' },
    { value: 'IN_TRANSIT', label: 'In Transit', color: 'bg-purple-100 text-purple-800' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  ];

  // Make Math available in template
  public Math = Math;

  protected readonly parcels = signal<Parcel[]>([]);
  protected readonly pagination = signal({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  protected readonly isLoading = signal(false);
  protected readonly selectedParcels = signal<Set<string>>(new Set());
  protected readonly selectedParcel = signal<Parcel | null>(null);

  // Modal states
  public showDetailsModal = false;
  public showUpdateStatusModal = false;
  public selectedStatus: string = '';

  // Send Parcel Modal State
  public showSendParcelModal = false;
  public adminParcel: any = {
    description: '',
    weight: null,
    receiverEmail: '',
    pickupLocation: '',
    destinationLocation: '',
    pickupLatitude: null,
    pickupLongitude: null,
    destinationLatitude: null,
    destinationLongitude: null
  };
  public isSending = false;
  public sendSuccess = false;
  public sendError = '';

  // Update location modal state
  public showUpdateLocationModal = false;
  public updateLocationParcel: any = {};
  public isUpdatingLocation = false;
  public updateLocationSuccess = false;
  public updateLocationError = '';

  // Parcel requests states
  public viewMode: 'parcels' | 'requests' = 'parcels';
  protected readonly parcelRequests = signal<ParcelRequest[]>([]);
  protected readonly parcelRequestPagination = signal({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  protected readonly isLoadingRequests = signal(false);

  requestToDelete: any = null;
  showDeleteRequestModal = false;
  updateStatusLoading = false;
  parcelToUpdate: Parcel | null = null;

  // Parcel deletion states
  parcelToDelete: Parcel | null = null;
  showDeleteParcelModal = false;
  isDeletingParcel = false;

  private subscriptions = new Subscription();

  constructor(
    private parcelService: ParcelService,
    private parcelRequestService: ParcelRequestService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    if (this.viewMode === 'parcels') {
      this.loadParcels();
    } else {
      this.loadParcelRequests();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  setViewMode(mode: 'parcels' | 'requests') {
    this.viewMode = mode;
    if (mode === 'parcels') {
      this.loadParcels();
    } else {
      this.loadParcelRequests();
    }
  }

  // Load parcels from the service
  private loadParcels() {
    this.isLoading.set(true);
    const { status, search, dateFrom, dateTo } = this.filters;

    this.parcelService.getAllParcels(
      this.pagination().page,
      this.pagination().limit,
      { status, search, dateFrom, dateTo }
    ).subscribe({
      next: (response: BackendResponse<PaginatedData<Parcel>>) => {
        if (response.success && response.data) {
          this.parcels.set(response.data.parcels);
          this.pagination.set({
            total: response.data.pagination.total,
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            totalPages: response.data.pagination.totalPages
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to load parcels');
        this.isLoading.set(false);
      }
    });
  }

  // Load parcel requests from the service
  private loadParcelRequests() {
    this.isLoadingRequests.set(true);
    const { status, search, dateFrom, dateTo } = this.filters;
    const filters: any = { status, search, dateFrom, dateTo };
    if (!status || status === 'ALL') {
      delete filters.status;
    }
    this.parcelRequestService.getParcelRequests(
      this.parcelRequestPagination().page,
      this.parcelRequestPagination().limit,
      filters
    ).subscribe({
      next: (response) => {
        if (response.requests && response.pagination) {
          this.parcelRequests.set(response.requests);
          this.parcelRequestPagination.set({
            total: response.pagination.total,
            page: response.pagination.page,
            limit: response.pagination.limit,
            totalPages: response.pagination.totalPages
          });
        }
        this.isLoadingRequests.set(false);
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to load parcel requests');
        this.isLoadingRequests.set(false);
      }
    });
  }

  // Pagination methods
  nextPage() {
    if (this.pagination().page < this.pagination().totalPages) {
      this.pagination.set({
        ...this.pagination(),
        page: this.pagination().page + 1
      });
      this.loadParcels();
    }
  }

  previousPage() {
    if (this.pagination().page > 1) {
      this.pagination.set({
        ...this.pagination(),
        page: this.pagination().page - 1
      });
      this.loadParcels();
    }
  }

  goToPage(page: number) {
    this.pagination.set({
      ...this.pagination(),
      page: page
    });
    this.loadParcels();
  }

  // Selection methods
  toggleParcelSelection(parcelId: string) {
    const selected = new Set(this.selectedParcels());
    if (selected.has(parcelId)) {
      selected.delete(parcelId);
    } else {
      selected.add(parcelId);
    }
    this.selectedParcels.set(selected);
  }

  onSelectAllChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectAllParcels();
    } else {
      this.clearSelection();
    }
  }

  selectAllParcels() {
    const allIds = new Set(this.parcels().map((p: Parcel) => p.id));
    this.selectedParcels.set(allIds);
  }

  clearSelection() {
    this.selectedParcels.set(new Set());
  }

  // Utility methods
  trackByParcelId(_index: number, parcel: Parcel): string {
    return parcel.id;
  }

  getPageNumbers(): number[] {
    const pagination = this.pagination();
    const totalPages = pagination.totalPages || 0;
    const currentPage = pagination.page || 1;
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'PICKED_UP': 'bg-blue-100 text-blue-800',
      'IN_TRANSIT': 'bg-purple-100 text-purple-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'RECEIVED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return `px-3 py-1 rounded-full text-xs font-semibold ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`;
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'PENDING': 'Pending',
      'PICKED_UP': 'Picked Up',
      'IN_TRANSIT': 'In Transit',
      'DELIVERED': 'Delivered',
      'RECEIVED': 'Received',
      'CANCELLED': 'Cancelled'
    };
    return statusTexts[status] || status;
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

  formatCurrency(amount: number, currency: string = 'KES'): string {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Modal methods
  openDetailsModal(parcel: Parcel) {
    this.selectedParcel.set(parcel);
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedParcel.set(null);
  }

  // Action methods
  approveRequest(parcelId: string) {
    const updateSub = this.parcelService.updateParcelStatus(parcelId, 'PICKED_UP').subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Parcel request approved');
        this.loadParcels();
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to approve request');
      }
    });
    this.subscriptions.add(updateSub);
  }

  rejectRequest(parcelId: string) {
    if (confirm('Are you sure you want to reject this parcel request?')) {
      const updateSub = this.parcelService.updateParcelStatus(parcelId, 'CANCELLED').subscribe({
        next: () => {
          this.notificationService.showSuccess('Success', 'Parcel request rejected');
          this.loadParcels();
        },
        error: () => {
          this.notificationService.showError('Error', 'Failed to reject request');
        }
      });
      this.subscriptions.add(updateSub);
    }
  }

  // Send parcel method
  sendParcel(parcel?: Parcel) {
    if (parcel) {
      this.isLoading.set(true);
      this.parcelService.updateParcelStatus(parcel.id, 'IN_TRANSIT').subscribe({
        next: () => {
          this.notificationService.showSuccess('Success', 'Parcel sent and marked as In Transit');
          this.loadParcels();
          this.isLoading.set(false);
        },
        error: () => {
          this.notificationService.showError('Error', 'Failed to send parcel');
          this.isLoading.set(false);
        }
      });
      return;
    }
    // Otherwise, create a new parcel (from the modal)
    this.isSending = true;
    this.sendError = '';
    this.sendSuccess = false;
    const parcelData = { ...this.adminParcel };
    if ('currentLocation' in parcelData) {
      delete parcelData.currentLocation;
    }
    ['pickupLatitude', 'pickupLongitude', 'destinationLatitude', 'destinationLongitude'].forEach((key) => {
      if (parcelData[key] === '' || parcelData[key] === null || isNaN(Number(parcelData[key]))) {
        delete parcelData[key];
      } else {
        parcelData[key] = Number(parcelData[key]);
      }
    });
    this.parcelService.createParcel(parcelData).subscribe({
      next: () => {
        this.isSending = false;
        this.sendSuccess = true;
        this.sendError = '';
        this.closeSendParcelModal();
        this.notificationService.showSuccess('Parcel Created', 'The parcel was created successfully.');
        this.loadParcels();
      },
      error: (err) => {
        this.isSending = false;
        this.sendError = err?.error?.message || 'Failed to create parcel.';
        this.notificationService.showError('Create Parcel Failed', this.sendError);
      }
    });
  }

  // Update location methods
  updateLocation(parcel: Parcel) {
    this.updateLocationParcel = {
      id: parcel.id,
      trackingNumber: parcel.trackingNumber,
      currentLocation: ''
    };
    this.showUpdateLocationModal = true;
    this.updateLocationSuccess = false;
    this.updateLocationError = '';
  }

  submitLocationUpdate() {
    this.isUpdatingLocation = true;
    this.updateLocationError = '';
    this.updateLocationSuccess = false;

    this.parcelService.updateParcelStatus(
      this.updateLocationParcel.id,
      'IN_TRANSIT',
      this.updateLocationParcel.currentLocation
    ).subscribe({
      next: () => {
        this.isUpdatingLocation = false;
        this.updateLocationSuccess = true;
        this.showUpdateLocationModal = false;
        this.notificationService.showSuccess('Success', 'Location updated');
        this.loadParcels();
      },
      error: (err: any) => {
        this.isUpdatingLocation = false;
        this.updateLocationError = err?.error?.message || 'Failed to update location.';
        this.notificationService.showError('Error', this.updateLocationError);
      }
    });
  }

  // Bulk update method
  bulkUpdateStatus(newStatus: string) {
    const selectedIds = Array.from(this.selectedParcels());
    if (selectedIds.length === 0) {
      this.notificationService.showWarning('Warning', 'Please select parcels to update');
      return;
    }

    if (confirm(`Are you sure you want to update ${selectedIds.length} parcels to ${this.getStatusText(newStatus)}?`)) {
      const bulkUpdateSub = this.parcelService.bulkUpdateStatus(selectedIds, newStatus).subscribe({
        next: (response: any) => {
          this.notificationService.showSuccess('Success', `${response.updatedCount} parcels updated successfully`);
          this.clearSelection();
          this.loadParcels();
        },
        error: (error: any) => {
          console.error('Error performing bulk update:', error);
          this.notificationService.showError('Error', error?.error?.message || 'Failed to perform bulk update');
          this.loadParcels();
        }
      });
      this.subscriptions.add(bulkUpdateSub);
    }
  }

  // Search and filter methods
  onSearch() {
    this.pagination.set({ ...this.pagination(), page: 1 });
    this.loadParcels();
  }

  onFilterChange() {
    this.pagination.set({ ...this.pagination(), page: 1 });
    this.loadParcels();
  }

  clearFilters() {
    this.filters = {
      status: 'ALL',
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      pageSize: 10
    };
    this.pagination.set({ total: 0, page: 1, limit: 10, totalPages: 0 });
    this.loadParcels();
  }

  // Close the update status modal
  closeUpdateStatusModal() {
    this.showUpdateStatusModal = false;
    this.selectedStatus = '';
    this.selectedParcel.set(null);
  }

  // Update parcel status from modal
  updateParcelStatus(parcelId: string, newStatus: string) {
    if (!parcelId || !newStatus) return;
    this.parcelService.updateParcelStatus(parcelId, newStatus).subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Parcel status updated');
        this.closeUpdateStatusModal();
        this.loadParcels();
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to update parcel status');
      }
    });
  }

  // Modal close methods
  openCreateParcelModal() {
    this.showSendParcelModal = true;
    this.adminParcel = {
      description: '',
      weight: null,
      receiverEmail: '',
      pickupLocation: '',
      currentLocation: '',
      destinationLocation: '',
      pickupLatitude: null,
      pickupLongitude: null,
      destinationLatitude: null,
      destinationLongitude: null
    };
    this.sendSuccess = false;
    this.sendError = '';
  }

  closeSendParcelModal() {
    this.showSendParcelModal = false;
    this.adminParcel = {
      description: '',
      weight: null,
      receiverEmail: '',
      pickupLocation: '',
      destinationLocation: ''
    };
    this.sendSuccess = false;
    this.sendError = '';
  }

  closeUpdateLocationModal() {
    this.showUpdateLocationModal = false;
    this.updateLocationParcel = {};
    this.updateLocationSuccess = false;
    this.updateLocationError = '';
  }

  approveParcelRequest(requestId: string) {
    if (!requestId) return;
    this.parcelRequestService.approveParcelRequest(requestId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Parcel request approved');
        this.loadParcelRequests();
        this.loadParcels(); // Patch: reload parcels to show updated status/location
      },
      error: (err) => {
        this.notificationService.showError('Error', err?.error?.message || 'Failed to approve parcel request');
      }
    });
  }

  rejectParcelRequest(requestId: string) {
    if (!requestId) return;
    const reason = prompt('Enter a reason for rejection (optional):') || '';
    if (!confirm('Are you sure you want to reject this parcel request?')) return;
    this.parcelRequestService.rejectParcelRequest(requestId, reason).subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Parcel request rejected');
        this.loadParcelRequests();
      },
      error: (err) => {
        this.notificationService.showError('Error', err?.error?.message || 'Failed to reject parcel request');
      }
    });
  }

  deleteParcelRequest(requestId: string) {
    const req = this.parcelRequests().find(r => r.id === requestId);
    if (!req) return;
    this.requestToDelete = req;
    this.showDeleteRequestModal = true;
  }

  confirmDeleteParcelRequest() {
    if (!this.requestToDelete) return;
    this.updateStatusLoading = true;
    this.parcelRequestService.deleteParcelRequest(this.requestToDelete.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Deleted', 'Parcel request deleted');
        this.showDeleteRequestModal = false;
        this.requestToDelete = null;
        this.updateStatusLoading = false;
        this.loadParcelRequests();
      },
      error: (err) => {
        this.notificationService.showError('Error', err?.error?.message || 'Failed to delete parcel request');
        this.showDeleteRequestModal = false;
        this.requestToDelete = null;
        this.updateStatusLoading = false;
      }
    });
  }

  cancelDeleteParcelRequest() {
    this.showDeleteRequestModal = false;
    this.requestToDelete = null;
  }

  // For status update modal
  openUpdateStatusModal(parcel: Parcel) {
    if (parcel.status === 'DELIVERED' || parcel.status === 'RECEIVED') {
      this.showUpdateStatusModal = false;
      this.parcelToUpdate = null;
      this.updateStatusLoading = false;
      return;
    }
    this.parcelToUpdate = parcel;
    this.selectedStatus = parcel.status;
    this.showUpdateStatusModal = true;
    this.updateStatusLoading = false;
  }

  // Only show the "Confirm Update Status" button if status is not DELIVERED or RECEIVED
  get canShowConfirmUpdateStatus(): boolean {
    return this.parcelToUpdate != null &&
      this.parcelToUpdate.status !== 'DELIVERED' &&
      this.parcelToUpdate.status !== 'RECEIVED';
  }

  confirmUpdateStatus() {
    if (!this.parcelToUpdate || !this.selectedStatus) return;
    if (this.parcelToUpdate.status === 'DELIVERED' || this.parcelToUpdate.status === 'RECEIVED') {
      this.showUpdateStatusModal = false;
      this.parcelToUpdate = null;
      this.updateStatusLoading = false;
      return;
    }
    this.updateStatusLoading = true;
    this.parcelService.updateParcelStatus(this.parcelToUpdate.id, this.selectedStatus).subscribe({
      next: () => {
        this.notificationService.showSuccess('Success', 'Parcel status updated');
        this.showUpdateStatusModal = false;
        this.parcelToUpdate = null;
        this.updateStatusLoading = false;
        this.loadParcels();
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to update parcel status');
        this.showUpdateStatusModal = false;
        this.parcelToUpdate = null;
        this.updateStatusLoading = false;
      }
    });
  }

  cancelUpdateStatus() {
    this.showUpdateStatusModal = false;
    this.parcelToUpdate = null;
    this.updateStatusLoading = false;
  }

  deleteParcel(parcelId: string) {
    const parcel = this.parcels().find(p => p.id === parcelId);
    if (!parcel) return;
    this.parcelToDelete = parcel;
    this.showDeleteParcelModal = true;
  }

  confirmDeleteParcel() {
    if (!this.parcelToDelete) return;
    this.isDeletingParcel = true;
    this.parcelService.deleteParcel(this.parcelToDelete.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Deleted', 'Parcel deleted');
        this.showDeleteParcelModal = false;
        this.parcelToDelete = null;
        this.isDeletingParcel = false;
        this.loadParcels();
      },
      error: (err) => {
        this.notificationService.showError('Error', err?.error?.message || 'Failed to delete parcel');
        this.showDeleteParcelModal = false;
        this.parcelToDelete = null;
        this.isDeletingParcel = false;
      }
    });
  }

  cancelDeleteParcel() {
    this.showDeleteParcelModal = false;
    this.parcelToDelete = null;
    this.isDeletingParcel = false;
  }
}
