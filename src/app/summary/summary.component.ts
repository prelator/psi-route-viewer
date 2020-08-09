import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.sass']
})
export class SummaryComponent implements OnInit {

  constructor (private _dataService: DataService) { }

  ngOnInit () {

  }

  altBClosures = this._dataService.getAltClosures('B');
  altCClosures = this._dataService.getAltClosures('C');
  altDClosures = this._dataService.getAltClosures('D');
  altEClosures = this._dataService.getAltClosures('E');
  countyClosures = this._dataService.getCountyClosures();
  districtClosures = this._dataService.getDistrictClosures();

}
