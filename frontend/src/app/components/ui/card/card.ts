import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './card.html',
  styleUrls: ['./card.scss']
})
export class CardComponent {
  @Input() title: string = '';
  @Input() footerText: string = '';
  @Input() routerLink: string = '';
  @Input() linkText: string = '';
  @Input() clickable: boolean = false;
  @Input() showActions: boolean = false;
  @Input() editAction: boolean = false;
  @Input() deleteAction: boolean = false;

  @Output() cardClick = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Event>();
  @Output() delete = new EventEmitter<Event>();

  onCardClick() {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(event);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    this.delete.emit(event);
  }
}
