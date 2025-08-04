import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from "@angular/material/icon";
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  isLoggedIn: boolean = false;
  showFooter = true;
  private sub: Subscription;
  private userSub?: Subscription;

  constructor(private router: Router, private authService: AuthService) {
    this.updateFooterVisibility(this.router.url);
    this.sub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.updateFooterVisibility(event.urlAfterRedirects || event.url);
      });
  }

  ngOnInit() {
    this.isLoggedIn = this.authService.isAuthenticated();
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });
  }

  private updateFooterVisibility(url: string) {
    this.showFooter = !/^\/dashboard(\/|$)/.test(url);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.userSub?.unsubscribe();
  }
}
