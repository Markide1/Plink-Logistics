import { Pipe, PipeTransform } from '@angular/core';

interface StatusConfig {
  text: string;
  classes: string;
}

@Pipe({
  name: 'statusBadge',
  standalone: true
})
export class StatusBadgePipe implements PipeTransform {
  private statusMap: { [key: string]: StatusConfig } = {
    'PENDING': {
      text: 'Pending',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800'
    },
    'IN_TRANSIT': {
      text: 'In Transit',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800'
    },
    'DELIVERED': {
      text: 'Delivered',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
    },
    'CANCELLED': {
      text: 'Cancelled',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800'
    },
    'ON_HOLD': {
      text: 'On Hold',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800'
    },
    'OUT_FOR_DELIVERY': {
      text: 'Out for Delivery',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800'
    },
    'ACTIVE': {
      text: 'Active',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800'
    },
    'INACTIVE': {
      text: 'Inactive',
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
    }
  };

  transform(status: string, returnType: 'text' | 'classes' | 'both' = 'both'): string | StatusConfig {
    if (!status) return '';
    
    const statusConfig = this.statusMap[status.toUpperCase()] || {
      text: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      classes: 'px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'
    };

    switch (returnType) {
      case 'text':
        return statusConfig.text;
      case 'classes':
        return statusConfig.classes;
      case 'both':
      default:
        return statusConfig;
    }
  }
}
