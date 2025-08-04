import { NotificationComponent } from './components/shared/notification/notification.component';
import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/shared/header/header';
import { FooterComponent } from './components/shared/footer/footer';
import { ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import * as AuthActions from './store/auth/auth.actions';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, NotificationComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  protected readonly title = signal('plink-frontend');
  private store = inject(Store);

  ngOnInit() {
    this.store.dispatch(AuthActions.loadUser());
  }
}
