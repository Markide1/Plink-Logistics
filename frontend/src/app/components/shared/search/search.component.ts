import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface SearchConfig {
  placeholder?: string;
  debounceTime?: number;
  showClearButton?: boolean;
  showSearchIcon?: boolean;
  minLength?: number;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  @Input() config: SearchConfig = {
    placeholder: 'Search...',
    debounceTime: 300,
    showClearButton: true,
    showSearchIcon: true,
    minLength: 0
  };

  @Input() initialValue: string = '';
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.searchTerm = this.initialValue;
    
    this.searchSubject
      .pipe(
        debounceTime(this.config.debounceTime || 300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((term) => {
        if (term.length >= (this.config.minLength || 0)) {
          this.search.emit(term);
        } else if (term.length === 0) {
          this.search.emit('');
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }

  onClear() {
    this.searchTerm = '';
    this.searchSubject.next('');
    this.clear.emit();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.search.emit(this.searchTerm);
    }
  }
}
