import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type IconName = 
  'home' | 'user' | 'package' | 'track' | 'contact' | 'login' | 'logout' | 
  'dashboard' | 'settings' | 'edit' | 'delete' | 'add' | 'search' | 'filter' |
  'check' | 'x' | 'info' | 'warning' | 'error' | 'success' | 'mail' | 'phone' |
  'location' | 'calendar' | 'clock' | 'star' | 'heart' | 'share' | 'download' |
  'upload' | 'refresh' | 'arrow-left' | 'arrow-right' | 'arrow-up' | 'arrow-down' |
  'menu' | 'close' | 'more' | 'notification' | 'chart' | 'report' | 'truck' |
  'box' | 'shield' | 'lock' | 'unlock' | 'eye' | 'eye-off' | 'copy' | 'save';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.html',
  styleUrls: ['./icon.scss']
})
export class IconComponent {
  @Input() name: IconName = 'home';
  @Input() size: number = 24;
  @Input() color: string = 'currentColor';
  @Input() customClass: string = '';

  get classes(): string {
    return `inline-block ${this.customClass}`;
  }
}
