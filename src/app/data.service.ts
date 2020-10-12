import { Injectable } from '@angular/core';
import { get, set, clear } from 'idb-keyval';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import actionRoutes from '../data/action.json';
import oldActionRoutes from '../data/oldAction.json';
import noActionRoutes from '../data/noAction.json';
import wildlifeData from '../data/wildlife.json';
import mvumRoads from '../data/mvumRoads.json';
import mvumTrails from '../data/mvumTrails.json';
import gisData from '../data/gisData.json';
import seasonalData from '../data/seasonal.json';

const dbVersion = 1;

const altList = ['A', 'B','C', 'D', 'E'];

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
  private cachedClosures = null;
  private mvumRoutes = {
    populated: false,
    roadMiles: 0,
    roadMilesStr: '',
    trailMiles: 0,
    trailMilesStr: '',
    systemMiles: 0,
    systemMilesStr: '',
    districts: {}
  };

  constructor (private http: HttpClient) { }

  private populateRoutes() {
    var routes = actionRoutes.map(actionRoute => {
      let combinedRoute : {[k: string]: any} = actionRoute;
      combinedRoute['WildlifeData'] = [];
      combinedRoute['UniqIDGIS'] = null;
      combinedRoute['OBJECTID_1'] = null;
      combinedRoute['MVUMdescription'] = 'No data';
      combinedRoute['AltCSeasonalDates'] = 'No data';

      // Matching no-action route
      let matchingRoute = noActionRoutes.find(noActionRoute => {
        return noActionRoute.RouteNumber === actionRoute.RouteNumber && noActionRoute.Name === actionRoute.Name && noActionRoute.MgtRngDist === actionRoute.MgtRngDist && (noActionRoute.GIS_Miles === actionRoute.TxtSegMi || noActionRoute.GIS_Miles === actionRoute.GIS_Miles);
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
        combinedRoute['AltCSeasonalDates'] = seasonalRoute.AltCSeasonalDates || 'No data';
        combinedRoute['County'] = seasonalRoute.County;
      }

      return combinedRoute;
    });

    this.combinedRoutes = routes;
    this.addWildlifeData();
    this.addGISData();

    // Storage
    try {
      clear();
      set('dbVersion', dbVersion);
      set('combinedRoutes', this.combinedRoutes);
    } catch (err) {
      console.error(`IDB storage error: ${err}`);
    }
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

  private addGISData() {
    gisData.forEach(gisRoute => {
      let matchingRoute = this.combinedRoutes.find(masterRoute => {
        let masterRouteGISMiles: number = parseFloat(<string> masterRoute.GIS_Miles);
        let gisRouteGISMiles: number = parseFloat(<string> gisRoute.GIS_Miles);
        let masterRouteLength: string = masterRouteGISMiles.toFixed(2);
        let gisRouteLength: string = gisRouteGISMiles.toFixed(2);

        return (masterRoute.RouteNumber === gisRoute.RouteNumber && masterRoute.AdmRngDist === gisRoute.AdmRngDist) && ((masterRoute.TxtBMP === gisRoute.TxtBMP && masterRoute.TxtEMP === gisRoute.TxtEMP) || (parseFloat(masterRouteLength) === parseFloat(gisRouteLength)));
      });
      if (matchingRoute) {
        matchingRoute['UniqIDGIS'] = gisRoute.UniqIDGIS;
        matchingRoute['OBJECTID_1'] = gisRoute.OBJECTID_1;
        matchingRoute['MVUMdescription'] = gisRoute.MVUMdescription;
        matchingRoute['AltCSeasonalDates'] = gisRoute.AltCseaDates;
        if (matchingRoute.AltAmgt2 === 'No data' && gisRoute.MVUMdescription !== 'No data') {
          matchingRoute.AltAmgt2 = gisRoute.MVUMdescription;
        }
        if (gisRoute.MVUMdescription === 'No data' && matchingRoute.AltAmgt2 !== 'No data') {
          matchingRoute.MVUMdescription = matchingRoute.AltAmgt2;
        }
      }
    });
  }

  public async getRoutes() {
    if (this.combinedRoutes.length === 0) {
      const storedVersion = await get('dbVersion');
      if (storedVersion && storedVersion === dbVersion) {
        const storedRoutes: any = await get('combinedRoutes');
        if (storedRoutes && storedRoutes.length > 0) {
          this.combinedRoutes = storedRoutes;
        }
      }
    }

    if (this.combinedRoutes.length === 0) {
      this.populateRoutes();
    }
    return this.combinedRoutes;
  }

  public async getRouteById(id) {
    let routes = await this.getRoutes();
    let foundRoute = routes.find(route => {
      return route.ID === parseInt(id);
    });
    return foundRoute;
  }

  public async getAllClosures() {
    if (!this.cachedClosures) {
      const storedClosures: any = await get('cachedClosures');
      if (storedClosures) {
        this.cachedClosures = storedClosures;
      }
    }

    if (this.cachedClosures) {
      return this.cachedClosures;
    } else {
      await this.populateClosures();
      return this.cachedClosures;
    }
  }

  public async getAltClosures(alt) {
    const closures = await this.getAllClosures();
    return closures[alt];
  }

  private async populateClosures() {
    const routes = await this.getRoutes();
    this.cachedClosures = {};

    altList.forEach(alt => {
      this.populateAltClosures(alt, routes);
    });

    set('cachedClosures', this.cachedClosures);
    return this.cachedClosures;
  }

  private populateAltClosures(alt, routes) {
    let result = {
      altName: alt,
      closedRoutes: [],
      numClosedSegments: 0,
      closedMiles: '',
      counties: {},
      districts: {}
    };

    const altStatusParam = `Alt${alt.toUpperCase()}mgt1`;
    const altPublicParam = `Alt${alt.toUpperCase()}mgtPublic`;
    let closedMiles = 0;

    routes.forEach(route => {
      let segMiles = typeof route['TxtSegMi'] === 'number' ? route['TxtSegMi'] : route['GIS_Miles'] || 0;
      let routeIsClosed  = false;

      if (route['AltAmgtPublic'] !== 'No data' && route[altPublicParam] !== 'No data') {
        routeIsClosed = (route['AltAmgtPublic'] === 'Open to public motor vehicle use' && route[altPublicParam] !== 'Open to public motor vehicle use');
      } else if (route.MVUMdescription.includes('open') && route[altPublicParam] !== 'No data') {
        routeIsClosed = route[altPublicParam] !== 'Open to public motor vehicle use';
      } else {
        routeIsClosed = route[altStatusParam] === 'NFS subtraction';
      }

      if (routeIsClosed) {
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

  public async getCountyClosures() {
    const closures = await this.getAllClosures();
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

  public async getDistrictClosures() {
    const closures = await this.getAllClosures();
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

  public async getAltTotals(alt) {
    const routes = alt === 'A' ? noActionRoutes : await this.getRoutes();
    const publicParam = `Alt${alt.toUpperCase()}mgtPublic`;

    let result = {
      altName: alt,
      openRoads: '',
      openTrails: '',
      openMiles: '',
      closedMiles: '',
      totalMiles: '',
      percentageOpen: '',
      percentageClosed: '',
      openRoutes: [],
      closedRoutes: [],
      districts: {}
    };
    let openRoads = 0;
    let openTrails = 0;
    let openMiles = 0;
    let closedMiles = 0;
    let totalMiles = 0;

    routes.forEach(route => {
      let segMiles = typeof route['TxtSegMi'] === 'number' ? route['TxtSegMi'] : route['GIS_Miles'] || 0;
      let district = route['MgtRngDist'];

      if (route[publicParam] !== 'No data') {
        totalMiles += segMiles;

        if (route[publicParam] === 'Open to public motor vehicle use') {
          if (!result.districts[district]) {
            result.districts[district] = {
              totalRoads: 0,
              totalTrails: 0,
              totalMiles: 0
            };
          }

          if (route['RouteType'] === 'ROAD') {
            openRoads += segMiles;
            result.districts[district].totalRoads += segMiles;
          } else {
            openTrails += segMiles;
            result.districts[district].totalTrails += segMiles;
          }

          result.districts[district].totalMiles += segMiles;
          openMiles += segMiles;
          result.openRoutes.push(route);
        } else {
          closedMiles += segMiles;
          result.closedRoutes.push(route);
        }
      }
    });

    // Shorten district miles
    for (let district in result.districts) {
      result.districts[district].totalRoads = result.districts[district].totalRoads.toFixed(1);
      result.districts[district].totalTrails = result.districts[district].totalTrails.toFixed(1);
      result.districts[district].totalMiles = result.districts[district].totalMiles.toFixed(1);
    }

    result.openRoads = openRoads.toFixed(1);
    result.openTrails = openTrails.toFixed(1);
    result.openMiles = openMiles.toFixed(1);
    result.closedMiles = closedMiles.toFixed(1);
    result.totalMiles = totalMiles.toFixed(1);

    let percentageOpen = openMiles / totalMiles * 100;
    let percentageClosed = closedMiles / totalMiles * 100;
    result.percentageOpen = `${percentageOpen.toFixed(1)}%`;
    result.percentageClosed = `${percentageClosed.toFixed(1)}%`;
    return result;
  }

  private populateMvumRoute(route, type) {
    let district = route['DISTRICTNAME'] || 'Unknown';
    if (district !== 'Cimarron Ranger District' && district !== 'Comanche Ranger District') {
      if (!this.mvumRoutes.districts[district]) {
        this.mvumRoutes.districts[district] = {
          totalRoads: 0,
          totalTrails: 0,
          totalMiles: 0
        };
      }
      if (type === 'road') {
        this.mvumRoutes.districts[district].totalRoads += route['SEG_LENGTH'];
        this.mvumRoutes.roadMiles += route['SEG_LENGTH'];
      } else {
        this.mvumRoutes.districts[district].totalTrails += route['SEG_LENGTH'];
        this.mvumRoutes.trailMiles += route['SEG_LENGTH'];
      }
      this.mvumRoutes.districts[district].totalMiles += route['SEG_LENGTH'];
      this.mvumRoutes.systemMiles += route['SEG_LENGTH'];
    }
  }

  public async getMvumRoutes() {
    if (!this.mvumRoutes.populated) {
      const storedRoutes: any = await get('mvumRoutes');
      if (storedRoutes && storedRoutes.populated) {
        this.mvumRoutes = storedRoutes;
      }
    }

    if (!this.mvumRoutes.populated) {
      mvumRoads.forEach(road => {
        this.populateMvumRoute(road, 'road');
      });

      mvumTrails.forEach(trail => {
        this.populateMvumRoute(trail, 'trail');
      });

      // Shorten district miles
      for (let district in this.mvumRoutes.districts) {
        this.mvumRoutes.districts[district].totalRoads = this.mvumRoutes.districts[district].totalRoads.toFixed(1);
        this.mvumRoutes.districts[district].totalTrails = this.mvumRoutes.districts[district].totalTrails.toFixed(1);
        this.mvumRoutes.districts[district].totalMiles = this.mvumRoutes.districts[district].totalMiles.toFixed(1);
      }

      // Shorten total system miles
      this.mvumRoutes.roadMilesStr = this.mvumRoutes.roadMiles.toFixed(1);
      this.mvumRoutes.trailMilesStr = this.mvumRoutes.trailMiles.toFixed(1);
      this.mvumRoutes.systemMilesStr = this.mvumRoutes.systemMiles.toFixed(1);

      // Set populated
      this.mvumRoutes.populated = true;
      set('mvumRoutes', this.mvumRoutes);
    }

    return this.mvumRoutes;
  }
}
