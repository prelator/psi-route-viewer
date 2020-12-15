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
  newClosedHighValueRoutes;
  newClosedHighValueRoutesNoTAP;
  changedClosed;
  changedOpen;
  closedConflict;
  tapClosures;
  allChangedRoutes;
  hhRoutes;

  async ngOnInit() {
    const allRoutes = await this._dataService.getRoutes();
    const allClosures = await this._dataService.getAltTotals('F');
    const newClosures = await this._dataService.getAltClosures('F');

    this.hhRoutes = allRoutes.filter(route => route.TAPrecRat === 'HH').sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });

    this.newClosedRoutes = newClosures.closedRoutes.sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });

    this.closedConflict = newClosures.closedRoutes.filter(route => {
      return route.TxtSegMi > 0.1 && route.QuietUse === 'Yes';
    }).sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });

    this.tapClosures = newClosures.closedRoutes.filter(route => {
      return route.TxtSegMi > 0.1 && route.TAPcmnts !== 'No data';
    }).sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });

    this.newClosedHighValueRoutes = this.newClosedRoutes.filter(route => {
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

    this.newClosedHighValueRoutesNoTAP = this.newClosedRoutes.filter(route => {
      return route.TAPcmnts === 'No data' && (route.TxtSegMi > 0.1 && (route.TAPrecRat === 'H' || route.TAPrecRat === 'M'));
    }).sort((a, b) => {
      if (a.TAPrecRat === 'H' && b.TAPrecRat !== 'H') {
        return -1;
      } else if (b.TAPrecRat === 'H' && a.TAPrecRat !== "H") {
        return 1;
      } else {
        return 0;
      }
    });

    this.highValueClosedRoutes = allClosures.closedRoutes.filter(route => {
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
    	return route.AltFmgtPublic !== 'No data' && (route.AltCmgtPublic === 'No data' || route.AltCmgtPublic === 'Open to public motor vehicle use') && route.AltCmgtPublic !== route.AltFmgtPublic && route.AltFmgtPublic !== 'Open to public motor vehicle use' && route.AltFmod && route.AltFmod !== 'No change made';
    }).sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });

    this.changedOpen = allRoutes.filter(route => {
    	return route.AltCmgtPublic !== route.AltFmgtPublic && route.AltFmgtPublic === 'Open to public motor vehicle use' && route.AltFmod && route.AltFmod !== 'No change made';
    }).sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });

    this.allChangedRoutes = allRoutes.filter(route => {
      return route.AltFmod && route.AltFmod !== 'No change made';
    }).sort((a, b) => {
      if (a.AdmRngDist < b.AdmRngDist) {
        return -1;
      } else if (a.AdmRngDist > b.AdmRngDist) {
        return 1;
      } else {
        return 0;
      }
    });
  }
}
