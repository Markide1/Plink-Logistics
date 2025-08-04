import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SearchComponent, SearchConfig } from '../search/search.component';
import { PaginationComponent, PaginationConfig } from '../pagination/pagination.component';

export interface DataListConfig {
  searchConfig?: SearchConfig;
  paginationConfig?: PaginationConfig;
  showSearch?: boolean;
  showPagination?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}

@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [CommonModule, SearchComponent, PaginationComponent],
  template: `
    <div class="w-full">
      <!-- Search Component -->
      <div *ngIf="config.showSearch && config.searchConfig" class="mb-4">
        <app-search 
          [config]="config.searchConfig"
          (search)="onSearch($event)"
          (clear)="onSearchClear()">
        </app-search>
      </div>

      <!-- Loading State -->
      <div *ngIf="config.loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading...</span>
      </div>

      <!-- Content Slot -->
      <div *ngIf="!config.loading" class="min-h-[200px]">
        <ng-content></ng-content>
      </div>

      <!-- Empty State -->
      <div *ngIf="!config.loading && isEmpty" class="text-center py-8">
        <div class="text-gray-400 text-lg mb-2">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <p class="text-gray-500">{{ config.emptyMessage || 'No data available' }}</p>
      </div>

      <!-- Pagination Component -->
      <div *ngIf="config.showPagination && config.paginationConfig && !isEmpty" class="mt-6">
        <app-pagination 
          [config]="config.paginationConfig"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)">
        </app-pagination>
      </div>
    </div>
  `,
  styleUrls: ['./data-list.component.scss']
})
export class DataListComponent implements OnInit, OnDestroy {
  @Input() config: DataListConfig = {
    showSearch: true,
    showPagination: true,
    loading: false,
    emptyMessage: 'No data available'
  };
  
  @Input() isEmpty: boolean = false;
  
  @Output() search = new EventEmitter<string>();
  @Output() searchClear = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Set default configurations if not provided
    if (this.config.showSearch && !this.config.searchConfig) {
      this.config.searchConfig = {
        placeholder: 'Search...',
        debounceTime: 300,
        showClearButton: true,
        showSearchIcon: true,
        minLength: 0
      };
    }

    if (this.config.showPagination && !this.config.paginationConfig) {
      this.config.paginationConfig = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        showSizeSelector: true,
        showInfo: true,
        maxVisiblePages: 5
      };
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(searchTerm: string) {
    this.search.emit(searchTerm);
  }

  onSearchClear() {
    this.searchClear.emit();
  }

  onPageChange(page: number) {
    this.pageChange.emit(page);
  }

  onPageSizeChange(pageSize: number) {
    this.pageSizeChange.emit(pageSize);
  }
}
