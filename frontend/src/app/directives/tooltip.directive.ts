import { Directive, Input, ElementRef, HostListener, Renderer2, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  
  private tooltipElement?: HTMLElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.tooltipText) {
      this.createTooltip();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.removeTooltip();
  }

  private createTooltip() {
    this.tooltipElement = this.renderer.createElement('div');
    this.renderer.appendChild(this.tooltipElement, this.renderer.createText(this.tooltipText));
    
    // Add base styles
    this.renderer.addClass(this.tooltipElement, 'absolute');
    this.renderer.addClass(this.tooltipElement, 'z-50');
    this.renderer.addClass(this.tooltipElement, 'px-2');
    this.renderer.addClass(this.tooltipElement, 'py-1');
    this.renderer.addClass(this.tooltipElement, 'text-sm');
    this.renderer.addClass(this.tooltipElement, 'text-white');
    this.renderer.addClass(this.tooltipElement, 'bg-gray-900');
    this.renderer.addClass(this.tooltipElement, 'rounded');
    this.renderer.addClass(this.tooltipElement, 'shadow-lg');
    this.renderer.addClass(this.tooltipElement, 'whitespace-nowrap');
    this.renderer.addClass(this.tooltipElement, 'pointer-events-none');
    
    // Position the tooltip
    const hostPos = this.el.nativeElement.getBoundingClientRect();
    
    switch (this.tooltipPosition) {
      case 'top':
        this.renderer.setStyle(this.tooltipElement, 'bottom', '120%');
        this.renderer.setStyle(this.tooltipElement, 'left', '50%');
        this.renderer.setStyle(this.tooltipElement, 'transform', 'translateX(-50%)');
        break;
      case 'bottom':
        this.renderer.setStyle(this.tooltipElement, 'top', '120%');
        this.renderer.setStyle(this.tooltipElement, 'left', '50%');
        this.renderer.setStyle(this.tooltipElement, 'transform', 'translateX(-50%)');
        break;
      case 'left':
        this.renderer.setStyle(this.tooltipElement, 'right', '120%');
        this.renderer.setStyle(this.tooltipElement, 'top', '50%');
        this.renderer.setStyle(this.tooltipElement, 'transform', 'translateY(-50%)');
        break;
      case 'right':
        this.renderer.setStyle(this.tooltipElement, 'left', '120%');
        this.renderer.setStyle(this.tooltipElement, 'top', '50%');
        this.renderer.setStyle(this.tooltipElement, 'transform', 'translateY(-50%)');
        break;
    }
    
    // Make parent relative if not already
    const parentPosition = window.getComputedStyle(this.el.nativeElement).position;
    if (parentPosition === 'static') {
      this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    }
    
    this.renderer.appendChild(this.el.nativeElement, this.tooltipElement);
  }

  private removeTooltip() {
    if (this.tooltipElement) {
      this.renderer.removeChild(this.el.nativeElement, this.tooltipElement);
      this.tooltipElement = undefined;
    }
  }

  ngOnDestroy() {
    this.removeTooltip();
  }
}
