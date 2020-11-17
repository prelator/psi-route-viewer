import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';

@Component({
  selector: 'app-decision',
  templateUrl: './decision.component.html',
  styleUrls: ['./decision.component.sass']
})
export class DecisionComponent implements OnInit {

  constructor(private _dataService: DataService) { }


  highValueClosedRoutes;
  newClosedRoutes;
  changedClosed;
  changedOpen;

  async ngOnInit() {
    const allRoutes = await this._dataService.getRoutes();
    const altTotals = await this._dataService.getAltTotals('F');
    const altF = await this._dataService.getAltClosures('F');
    
    this.newClosedRoutes = altF.closedRoutes;
    
    this.highValueClosedRoutes = altTotals.closedRoutes.filter(route => {
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

    this.changedClosed = allRoutes.filter(route => {
    	return route.AltFmgtPublic !== 'No data' && (route.AltCmgtPublic === 'No data' || route.AltCmgtPublic === 'Open to public motor vehicle use') && route.AltCmgtPublic !== route.AltFmgtPublic && route.AltFmgtPublic !== 'Open to public motor vehicle use';
    });

    this.changedOpen = allRoutes.filter(route => {
    	return route.AltCmgtPublic !== route.AltFmgtPublic && route.AltFmgtPublic === 'Open to public motor vehicle use';
    });
  }

}
