import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserService,
  User,
  PaginatedResponse,
} from '../../../services/user.service';
import { NotificationService } from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import { getUserName } from '../../../models/types';
import { DeleteConfirmationComponent } from '../../ui/delete-confirmation/delete-confirmation';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DeleteConfirmationComponent],
  templateUrl: './admin-users.html',
  styleUrls: ['./admin-users.scss'],
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: PaginatedResponse<User> = {
    data: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  };
  errorMessage = '';
  search = '';
  roleFilter = 'ALL';
  statusFilter = 'ALL';
  private subscriptions = new Subscription();
  public Math = Math;

  roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'USER', label: 'User' },
  ];
  statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  showDeleteModal = false;
  userToDelete: User | null = null;
  viewMode: 'users' | 'other' = 'users';

  constructor(
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    // Always load users on component init, regardless of viewMode
    this.loadUsers(1);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadUsers(page: number = 1) {
    this.errorMessage = '';

    const searchParam = this.search.trim() || undefined;
    const roleParam = this.roleFilter !== 'ALL' ? this.roleFilter : undefined;
    const isActiveParam = this.statusFilter !== 'ALL'
      ? (this.statusFilter === 'ACTIVE')
      : undefined;

    const sub = this.userService
      .getAllUsers(
        page,
        this.users.pageSize,
        searchParam,
        roleParam as 'ALL' | 'ADMIN' | 'USER'| undefined,
        isActiveParam
      )
      .subscribe({
        next: (response: any) => {
          let usersArr: User[] = [];
          let totalCount = 0, currentPage = page, pageSize = 10, totalPages = 1;
          if (response?.data && Array.isArray(response.data)) {
            usersArr = response.data;
            totalCount = usersArr.length;
          } else if (response?.data && Array.isArray(response.data.users)) {
            usersArr = response.data.users;
            totalCount = response.data.pagination?.total || usersArr.length;
            currentPage = response.data.pagination?.page || page;
            pageSize = response.data.pagination?.limit || 10;
            totalPages = response.data.pagination?.totalPages || 1;
          } else if (Array.isArray(response)) {
            usersArr = response;
            totalCount = usersArr.length;
          } else if (response?.users && Array.isArray(response.users)) {
            usersArr = response.users;
            totalCount = response.pagination?.total || usersArr.length;
            currentPage = response.pagination?.page || page;
            pageSize = response.pagination?.limit || 10;
            totalPages = response.pagination?.totalPages || 1;
          }
          this.users = {
            data: usersArr,
            totalCount,
            currentPage,
            pageSize,
            totalPages,
            hasNext: currentPage < totalPages,
            hasPrevious: currentPage > 1,
          };
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Failed to load users';
        },
      });
    this.subscriptions.add(sub);
  }

  onSearch() {
    this.loadUsers(1);
  }

  clearFilters() {
    this.search = '';
    this.roleFilter = 'ALL';
    this.statusFilter = 'ALL';
    this.loadUsers(1);
  }

  nextPage() {
    if (this.users.hasNext) {
      this.loadUsers(this.users.currentPage + 1);
    }
  }

  previousPage() {
    if (this.users.hasPrevious) {
      this.loadUsers(this.users.currentPage - 1);
    }
  }

  activateUser(user: User) {
    const sub = this.userService.activateUser(user.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          'User Activated',
          `${this.getUserName(user)} is now active.`
        );
        this.loadUsers(this.users.currentPage);
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to activate user');
      },
    });
    this.subscriptions.add(sub);
  }

  deactivateUser(user: User) {
    const sub = this.userService.deactivateUser(user.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          'User Deactivated',
          `${this.getUserName(user)} is now inactive.`
        );
        this.loadUsers(this.users.currentPage);
      },
      error: () => {
        this.notificationService.showError(
          'Error',
          'Failed to deactivate user'
        );
      },
    });
    this.subscriptions.add(sub);
  }

  deleteUser(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDeleteUser() {
    if (!this.userToDelete) return;
    const user = this.userToDelete;
    const sub = this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          'User Deleted',
          `${this.getUserName(user)} has been deleted.`
        );
        this.showDeleteModal = false;
        this.userToDelete = null;
        if (this.users.data.length === 1 && this.users.currentPage > 1) {
          this.loadUsers(this.users.currentPage - 1);
        } else {
          this.loadUsers(this.users.currentPage);
        }
      },
      error: () => {
        this.notificationService.showError('Error', 'Failed to delete user');
        this.showDeleteModal = false;
        this.userToDelete = null;
      },
    });
    this.subscriptions.add(sub);
  }

  cancelDeleteUser() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  getUserName(user: User): string {
    return getUserName(user);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isUserActive(user: User): boolean {
    return user.isActive !== false;
  }

  getUserStatus(user: User): string {
    return this.isUserActive(user) ? 'Active' : 'Inactive';
  }

  setViewMode(mode: 'users' | 'other') {
    this.viewMode = mode;
    // Always reload users when switching to users view
    if (mode === 'users') {
      this.loadUsers(1);
    }
  }
}