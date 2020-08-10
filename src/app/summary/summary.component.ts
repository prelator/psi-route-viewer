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

  altATotals = this._dataService.getAltTotals('A');
  altBTotals = this._dataService.getAltTotals('B');
  altCTotals = this._dataService.getAltTotals('C');
  altDTotals = this._dataService.getAltTotals('D');
  altETotals = this._dataService.getAltTotals('E');

  altBClosures = this._dataService.getAltClosures('B');
  altCClosures = this._dataService.getAltClosures('C');
  altDClosures = this._dataService.getAltClosures('D');
  altEClosures = this._dataService.getAltClosures('E');

  countyClosures = this._dataService.getCountyClosures();
  districtClosures = this._dataService.getDistrictClosures();
}
