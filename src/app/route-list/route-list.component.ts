import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-route-list',
  templateUrl: './route-list.component.html',
  styleUrls: ['./route-list.component.sass']
})
export class RouteListComponent implements OnInit {

  constructor(private _dataService: DataService) {

  }

  routes;
  searchText;

  async ngOnInit () {
    this.routes = await this._dataService.getRoutes();
  }
}
