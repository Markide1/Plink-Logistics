import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null, format: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string {
    if (!value) return '';
    
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit'
        });
      
      case 'medium':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      
      case 'long':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'relative':
        if (diffDays === 0) {
          return 'Today';
        } else if (diffDays === 1) {
          return 'Yesterday';
        } else if (diffDays < 7) {
          return `${diffDays} days ago`;
        } else if (diffDays < 30) {
          return `${Math.floor(diffDays / 7)} weeks ago`;
        } else if (diffDays < 365) {
          return `${Math.floor(diffDays / 30)} months ago`;
        } else {
          return `${Math.floor(diffDays / 365)} years ago`;
        }
        
      default:
        return date.toLocaleDateString();
    }
  }
}
