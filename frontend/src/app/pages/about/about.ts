import { Component } from '@angular/core';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
  standalone: true,
  imports: [MatIconModule]
})
export class About {
  constructor() {}
}
