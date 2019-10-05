import { Component } from '@angular/core';
import { DataService } from './data.service';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  providers: [ DataService ]
})
export class AppComponent {
  constructor (private _dataService: DataService) {

  }

  toggleNavbar () {
    this.navbarOpen = !this.navbarOpen;
  }

  title = 'PSI Travel Management Route Viewer';
  navbarOpen = false;
}
