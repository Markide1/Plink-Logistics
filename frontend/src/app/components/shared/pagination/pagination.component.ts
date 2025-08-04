import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  showSizeSelector?: boolean;
  showInfo?: boolean;
  maxVisiblePages?: number;
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnChanges {
  @Input() config: PaginationConfig = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    showSizeSelector: true,
    showInfo: true,
    maxVisiblePages: 5
  };

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  visiblePages: number[] = [];
  pageSizeOptions = [5, 10, 20, 50, 100];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config']) {
      this.calculateVisiblePages();
    }
  }

  private calculateVisiblePages() {
    const maxVisible = this.config.maxVisiblePages || 5;
    const currentPage = this.config.currentPage;
    const totalPages = this.config.totalPages;

    this.visiblePages = [];

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        this.visiblePages.push(i);
      }
    } else {
      // Calculate range around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);

      // Adjust start if we're near the end
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        this.visiblePages.push(i);
      }
    }
  }

  onPageClick(page: number) {
    if (page >= 1 && page <= this.config.totalPages && page !== this.config.currentPage) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    this.pageSizeChange.emit(newSize);
  }

  get startItem(): number {
    return (this.config.currentPage - 1) * this.config.itemsPerPage + 1;
  }

  get endItem(): number {
    const end = this.config.currentPage * this.config.itemsPerPage;
    return Math.min(end, this.config.totalItems);
  }

  get canGoPrevious(): boolean {
    return this.config.currentPage > 1;
  }

  get canGoNext(): boolean {
    return this.config.currentPage < this.config.totalPages;
  }

  get showFirstPage(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[0] > 1;
  }

  get showLastPage(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[this.visiblePages.length - 1] < this.config.totalPages;
  }

  get showFirstEllipsis(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[0] > 2;
  }

  get showLastEllipsis(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[this.visiblePages.length - 1] < this.config.totalPages - 1;
  }
}
