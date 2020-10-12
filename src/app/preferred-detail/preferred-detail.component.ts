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
    return (route.TxtSegMi > 0.1 && (route.TAPrecRat === 'H' || route.TAPrecRat === 'M'));
  }).sort((a, b) => {
    if (a.TAPrecRat === 'H' && b.TAPrecRat !== 'H') {
      return -1;
    } else if (b.TAPrecRat === 'H' && a.TAPrecRat !== "H") {
      return 1;
    } else {
      return 0;
    }
  });
  newClosedRoutes = this._dataService.getAltClosures('C').closedRoutes;
}
