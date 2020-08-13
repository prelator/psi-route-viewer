import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-preferred-detail',
  templateUrl: './preferred-detail.component.html',
  styleUrls: ['./preferred-detail.component.sass']
})
export class PreferredDetailComponent implements OnInit {

  constructor(private _dataService: DataService) { }

  ngOnInit() {
  }

  highValueClosedRoutes = this._dataService.getAltTotals('C').closedRoutes.filter(route => {
    return route.TAPrecRat === 'H' || route.TAPrecRat === 'M';
  });
  newClosedRoutes = this._dataService.getAltClosures('C').closedRoutes;
}
