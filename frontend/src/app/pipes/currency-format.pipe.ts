import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat'
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number, currency: string = 'KES'): string {
    if (!value) return `${currency} 0.00`;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    }).format(value);
  }
}
