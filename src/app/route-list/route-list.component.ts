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

  ngOnInit () {

  }

  searchText;
  routes = this._dataService.getRoutes();
  altBClosures = this._dataService.getAltClosures('B');
  altCClosures = this._dataService.getAltClosures('C');
  altDClosures = this._dataService.getAltClosures('D');
  altEClosures = this._dataService.getAltClosures('E');
  countyClosures = this._dataService.getCountyClosures();
  districtClosures = this._dataService.getDistrictClosures();
}
