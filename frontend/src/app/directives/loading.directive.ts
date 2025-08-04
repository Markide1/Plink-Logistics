import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLoading]'
})
export class LoadingDirective implements OnChanges {
  @Input() appLoading: boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges() {
    if (this.appLoading) {
      this.renderer.addClass(this.el.nativeElement, 'loading');
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
      
      // Add loading spinner
      const spinner = this.renderer.createElement('div');
      this.renderer.addClass(spinner, 'spinner');
      this.renderer.appendChild(this.el.nativeElement, spinner);
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'loading');
      this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
      
      // Remove loading spinner
      const spinner = this.el.nativeElement.querySelector('.spinner');
      if (spinner) {
        this.renderer.removeChild(this.el.nativeElement, spinner);
      }
    }
  }
}
