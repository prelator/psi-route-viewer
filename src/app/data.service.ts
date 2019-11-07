import { Injectable } from '@angular/core';
import actionRoutes from '../data/action.json';
import oldActionRoutes from '../data/oldAction.json';
import noActionRoutes from '../data/noAction.json';
import seasonalData from '../data/seasonal.json';
import wildlifeData from '../data/wildlife.json';

const NSGlobalRanks = {
  GX: 'Presumed Extinct',
  GH: 'Possibly Extinct',
  G1: 'Critically Imperiled',
  G2: 'Imperiled',
  G3: 'Vulnerable',
  G4: 'Apparently Secure',
  G5: 'Secure',
  GNR: 'Not Rated'
};

const NSStateRanks = {
  SX: 'Presumed Extinct',
  SH: 'Possibly Extinct',
  S1: 'Critically Imperiled',
  S2: 'Imperiled',
  S3: 'Vulnerable',
  S4: 'Apparently Secure',
  S5: 'Secure',
  SNR: 'Not Rated'
};

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private combinedRoutes = [];

  constructor () {

  }

  private populateRoutes() {
    var routes = actionRoutes.map(actionRoute => {
      let combinedRoute : {[k: string]: any} = actionRoute;
      combinedRoute['WildlifeData'] = [];

      // Matching no-action route
      let matchingRoute = noActionRoutes.find(noActionRoute => {
        return noActionRoute.RouteNumber === actionRoute.RouteNumber && noActionRoute.Name === actionRoute.Name && noActionRoute.MgtRngDist === actionRoute.MgtRngDist && (noActionRoute.GIS_Miles === actionRoute.TxtSegMi || noActionRoute.GIS_Miles === actionRoute.GIS_Miles);
      });
      matchingRoute = matchingRoute || noActionRoutes.find(noActionRoute => {
        return noActionRoute.RouteNumber === actionRoute.RouteNumber && noActionRoute.Name === actionRoute.Name && noActionRoute.MgtRngDist === actionRoute.MgtRngDist;
      });
      if (matchingRoute) {
        combinedRoute['AltAmgt1'] = matchingRoute.AltAmgt1;
        combinedRoute['AltAmgt2'] = matchingRoute.AltAmgt2;
        combinedRoute['AltAmgt3'] = matchingRoute.AltAmgt3;
        combinedRoute['AltAmgtSea'] = matchingRoute.AltAmgtSea;
        combinedRoute['AltAmgtPublic'] = matchingRoute.AltAmgtPublic;
      } else {
        combinedRoute['AltAmgt1'] = 'No data';
        combinedRoute['AltAmgt2'] = 'No data';
        combinedRoute['AltAmgt3'] = 'No data';
        combinedRoute['AltAmgtSea'] = 'No data';
        combinedRoute['AltAmgtPublic'] = 'No data';
      }

      // Matching old action route
      let oldMatchingRoute = oldActionRoutes.find(oldActionRoute => {
        return oldActionRoute.RouteNumber === actionRoute.RouteNumber && oldActionRoute.NAME === actionRoute.Name && oldActionRoute.MgtRngDist === actionRoute.MgtRngDist && oldActionRoute.TxtSegMils === actionRoute.TxtSegMi;
      });
      if (oldMatchingRoute) {
        combinedRoute['TAPsurfTy'] = oldMatchingRoute.TAPsurfTy || 'No data';
        combinedRoute['TAPcmnts'] = oldMatchingRoute.TAPcmnts || 'No data';;
        combinedRoute['CurrMTC'] = oldMatchingRoute.CurrMTC || 'No data';;
        combinedRoute['DesiredMTC'] = oldMatchingRoute.DesiredMTC || 'No data';;
        combinedRoute['County'] = oldMatchingRoute.County || 'No data';
      } else {
        combinedRoute['TAPsurfTy'] = 'No data';
        combinedRoute['TAPcmnts'] = 'No data';;
        combinedRoute['CurrMTC'] = 'No data';;
        combinedRoute['DesiredMTC'] = 'No data';;
        combinedRoute['County'] = 'No data';
      }

      // Matching route in seasonal closure data
      let seasonalRoute = seasonalData.find(seasRoute => {
        return (actionRoute.RouteNumber === seasRoute.RouteNumber && actionRoute.Name === seasRoute.Name && actionRoute.MgtRngDist === seasRoute.MgtRngDist) && (actionRoute.TxtSegMi === seasRoute.TxtSegMi || actionRoute.TxtBMP === seasRoute.TxtBMP || actionRoute.TxtEMP === seasRoute.TxtEMP);
      });
      if (seasonalRoute) {
        combinedRoute['AltCSeasonalDates'] = seasonalRoute.AltCSeasonalDates || 'N/A';
      } else {
        combinedRoute['AltCSeasonalDates'] = 'N/A';
      }

      return combinedRoute;
    });

    this.combinedRoutes = routes;
    this.addWildlifeData();
  }

  private addWildlifeData () {
    wildlifeData.forEach(wildRoute => {
      if (wildRoute.AreaName) {
        wildRoute.ValueName += ` - ${wildRoute.AreaName}`;
      }

      if (wildRoute.NatureServeGlobal && wildRoute.NatureServeGlobal !== 'NA') {
        let NSGDef = NSGlobalRanks[wildRoute.NatureServeGlobal];
        wildRoute.NatureServeGlobal +=` (${NSGDef})`;
      }

      if (wildRoute.NatureServeColorado && wildRoute.NatureServeColorado !== 'NA') {
        let NSSDef = NSStateRanks[wildRoute.NatureServeColorado];
        wildRoute.NatureServeColorado +=` (${NSSDef})`;
      }

      if (!wildRoute.Date) {
        wildRoute.Date = 'NA';
      }

      if (!wildRoute.CPWConservationStatus) {
        wildRoute.CPWConservationStatus = 'NA';
      }

      if (!wildRoute.USFSSensitiveSpecies) {
        wildRoute.USFSSensitiveSpecies = 'No';
      }

      if (!wildRoute.FWSESAStatus) {
        wildRoute.FWSESAStatus = 'NA';
      }

      if (!wildRoute.RMWSpeciesRank) {
        wildRoute.RMWSpeciesRank = 'NA';
      }

      let matchingRoute = this.combinedRoutes.find(route => {
        return route.RouteNumber === wildRoute.RouteNumber && route.Name === wildRoute.Name && (route.MgtRngDist === wildRoute.RangerDistrict || route.AdmRngDist === wildRoute.RangerDistrict) && route.TxtBMP === wildRoute.BMP;
      });
      if (matchingRoute) {
        matchingRoute.WildlifeData.push(wildRoute);
      }
    });
  }

  public getRoutes() {
    if (this.combinedRoutes.length === 0) {
      this.populateRoutes();
    }
    return this.combinedRoutes;
  }

  public getRouteById(id) {
    let routes = this.getRoutes();
    let foundRoute = routes.find(route => {
      return route.ID === parseInt(id);
    });
    return foundRoute;
  }
}
