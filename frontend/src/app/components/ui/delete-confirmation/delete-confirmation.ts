import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirmation.html',
  styleUrls: ['./delete-confirmation.scss'],
})
export class DeleteConfirmationComponent {
  @Input() isVisible: boolean = false;
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() itemName: string = '';
  @Input() confirmText: string = 'Delete';
  @Input() cancelText: string = 'Cancel';
  @Input() isLoading: boolean = false;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
