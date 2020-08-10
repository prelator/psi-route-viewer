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
  private cachedClosures = {};

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
        combinedRoute['County'] = oldMatchingRoute.County || 'UNKNOWN';
      } else {
        combinedRoute['TAPsurfTy'] = 'No data';
        combinedRoute['TAPcmnts'] = 'No data';;
        combinedRoute['CurrMTC'] = 'No data';;
        combinedRoute['DesiredMTC'] = 'No data';;
        combinedRoute['County'] = 'UNKNOWN';
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

  public getAltClosures(alt) {
    if (this.cachedClosures[alt]) {
      return this.cachedClosures[alt];
    }

    let result = {
      altName: alt,
      closedRoutes: [],
      numClosedSegments: 0,
      closedMiles: '',
      counties: {},
      districts: {}
    };

    const routes = this.getRoutes();
    const statusParam = `Alt${alt.toUpperCase()}mgt1`;
    const publicParam = `Alt${alt.toUpperCase()}mgtPublic`;
    let closedMiles = 0;

    routes.forEach(route => {
      let segMiles = typeof route['TxtSegMi'] === 'number' ? route['TxtSegMi'] : route['GIS_Miles'] || 0;
      if (route[statusParam] === 'NFS subtraction' ||
        (route['AltAmgtPublic'] === 'Open to public motor vehicle use' && route[publicParam] !== 'No data' && route[publicParam] !== route['AltAmgtPublic'])) {
        result.closedRoutes.push(route);
        closedMiles += segMiles;

        const county = route['County'] && route['County'].replace('CO - ', '');
        if (county) {
          if (!result.counties.hasOwnProperty(county)) {
            result.counties[county] = segMiles;
          } else {
            result.counties[county] += segMiles;
          }
        }

        const district = route['MgtRngDist'];
        if (district) {
          if (!result.districts.hasOwnProperty(district)) {
            result.districts[district] = segMiles;
          } else {
            result.districts[district] += segMiles;
          }
        }
      }
    });

    result.numClosedSegments = result.closedRoutes.length;
    result.closedMiles = closedMiles.toFixed(1);

    for (const county in result.counties) {
      result.counties[county] = result.counties[county].toFixed(1);
    }

    for (const distr in result.districts) {
      result.districts[distr] = result.districts[distr].toFixed(1);
    }

    this.cachedClosures[alt] = result;
    return result;
  }

  public getCountyClosures() {
    const closures = this.cachedClosures;
    let result = {};
    for (let alt in closures) {
      for (let county in closures[alt].counties) {
        if (!result[county]) {
          result[county] = {
            B: '0.0',
            C: '0.0',
            D: '0.0',
            E: '0.0'
          };
        }
        result[county][alt] = closures[alt].counties[county] || '0.0';
      }
    }
    return result;
  }

  public getDistrictClosures() {
    const closures = this.cachedClosures;
    let result = {};
    for (let alt in closures) {
      for (let distr in closures[alt].districts) {
        if (!result[distr]) {
          result[distr] = {};
        }
        result[distr][alt] = closures[alt].districts[distr] || '0.0';
      }
    }
    return result;
  }

  public getAltTotals(alt) {
    const routes = alt === 'A' ? noActionRoutes : this.getRoutes();
    const publicParam = `Alt${alt.toUpperCase()}mgtPublic`;

    let result = {
      altName: alt,
      openMiles: '',
      closedMiles: '',
      totalMiles: '',
      percentageOpen: '',
      percentageClosed: '',
      openRoutes: [],
      closedRoutes: []
    };

    let openMiles = 0;
    let closedMiles = 0;
    let totalMiles = 0;

    routes.forEach(route => {
      let segMiles = typeof route['TxtSegMi'] === 'number' ? route['TxtSegMi'] : route['GIS_Miles'] || 0;
      totalMiles += segMiles;

      if (route[publicParam] === 'Open to public motor vehicle use') {
        openMiles += segMiles;
        result.openRoutes.push(route);
      } else if (route[publicParam] !== 'No data') {
        closedMiles += segMiles;
        result.closedRoutes.push(route);
      }
    });

    result.openMiles = openMiles.toFixed(1);
    result.closedMiles = closedMiles.toFixed(1);
    result.totalMiles = totalMiles.toFixed(1);

    let percentageOpen = openMiles / totalMiles * 100;
    let percentageClosed = closedMiles / totalMiles * 100;
    result.percentageOpen = `${percentageOpen.toFixed(1)}%`;
    result.percentageClosed = `${percentageClosed.toFixed(1)}%`;
    return result;
  }
}
