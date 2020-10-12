import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.sass']
})
export class SummaryComponent implements OnInit {

  constructor (private _dataService: DataService) { }

  altATotals;
  altBTotals;
  altCTotals;
  altDTotals;
  altETotals;
  altBClosures;
  altCClosures;
  altDClosures;
  altEClosures;
  countyClosures;
  districtClosures;
  mvumRoutes;

  async ngOnInit () {
    this.mvumRoutes = await this._dataService.getMvumRoutes();

    this.altATotals = await this._dataService.getAltTotals('A');
    this.altBTotals = await this._dataService.getAltTotals('B');
    this.altCTotals = await this._dataService.getAltTotals('C');
    this.altDTotals = await this._dataService.getAltTotals('D');
    this.altETotals = await this._dataService.getAltTotals('E');

    this.altBClosures = await this._dataService.getAltClosures('B');
    this.altCClosures = await this._dataService.getAltClosures('C');
    this.altDClosures = await this._dataService.getAltClosures('D');
    this.altEClosures = await this._dataService.getAltClosures('E');

    this.countyClosures = await this._dataService.getCountyClosures();
    this.districtClosures = await this._dataService.getDistrictClosures();
  }
}
