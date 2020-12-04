import { Injectable } from '@angular/core';
import { get, set, clear } from 'idb-keyval';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

const dbVersion = 6;

const altList = ['A', 'B','C', 'D', 'E', 'F'];

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
  private noActionRoutes = [];
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

  private async populateRoutes() {
    const actionRoutes = await this.http.get<any[]>('assets/data/action.json').toPromise();
    const noActionRoutes = this.noActionRoutes = await this.http.get<any[]>('assets/data/noAction.json').toPromise();
    const oldActionRoutes = await this.http.get<any[]>('assets/data/oldAction.json').toPromise();
    const seasonalData = await this.http.get<any[]>('assets/data/seasonal.json').toPromise();

    var routes = actionRoutes.map(actionRoute => {
      let combinedRoute : {[k: string]: any} = actionRoute;
      combinedRoute['WildlifeData'] = [];
      combinedRoute['UniqIDGIS'] = null;
      combinedRoute['MVUMdescription'] = 'No data';
      combinedRoute['AltCSeasonalDates'] = 'No data';
      combinedRoute['AltF'] = 'No data';
      combinedRoute['AltFmgt1'] = 'No Data';
      combinedRoute['AltFmgt2'] = 'No data';
      combinedRoute['AltFmgt3'] = 'No data';
      combinedRoute['AltFmgtSea'] = 'No data';
      combinedRoute['AltFmgtPublic'] = 'No data';
      combinedRoute['AltFseaDates'] = 'No data';
      combinedRoute['AltFmod'] = '';
      combinedRoute['AltF2020ModNo'] = '';

      // Matching no-action route
      let matchingRoute = noActionRoutes.find(noActionRoute => {
        return noActionRoute.RouteNumber === actionRoute.RouteNumber && noActionRoute.Name === actionRoute.Name && (noActionRoute.GIS_Miles === actionRoute.TxtSegMi || noActionRoute.GIS_Miles === actionRoute.GIS_Miles);
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
        return oldActionRoute.RouteNumber === actionRoute.RouteNumber && oldActionRoute.NAME === actionRoute.Name && (oldActionRoute.TxtSegMils === actionRoute.TxtSegMi || oldActionRoute.TxtEndMP === actionRoute.TxtEMP);
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
        return (actionRoute.RouteNumber === seasRoute.RouteNumber && actionRoute.Name === seasRoute.Name) && (actionRoute.TxtSegMi === seasRoute.TxtSegMi || actionRoute.TxtBMP === seasRoute.TxtBMP || actionRoute.TxtEMP === seasRoute.TxtEMP);
      });
      if (seasonalRoute) {
        combinedRoute['AltCSeasonalDates'] = seasonalRoute.AltCSeasonalDates || 'No data';
        combinedRoute['County'] = seasonalRoute.County;
      }

      return combinedRoute;
    });

    this.combinedRoutes = routes;
    await this.addGISData();
    await this.addFEISData();
    await this.addWildlifeData();

    // Storage
    try {
      clear();
      set('dbVersion', dbVersion);
      set('combinedRoutes', this.combinedRoutes);
      set('noActionRoutes', this.noActionRoutes);
    } catch (err) {
      console.error(`IDB storage error: ${err}`);
    }
  }

  private async addWildlifeData () {
    const wildlifeData = await this.http.get<any[]>('assets/data/wildlife.json').toPromise();

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
        return route.RouteNumber === wildRoute.RouteNumber && route.Name === wildRoute.Name && route.TxtBMP === wildRoute.BMP;
      });
      if (matchingRoute) {
        matchingRoute.WildlifeData.push(wildRoute);
      }
    });
  }

  private async addGISData() {
    const gisData = await this.http.get<any[]>('assets/data/gisData.json').toPromise();

    gisData.forEach(gisRoute => {
      let matchingRoute = this.combinedRoutes.find(masterRoute => {
        let masterRouteGISMiles: number = parseFloat(<string> masterRoute.GIS_Miles);
        let gisRouteGISMiles: number = parseFloat(<string> gisRoute.GIS_Miles);
        let masterRouteLength: string = masterRouteGISMiles.toFixed(2);
        let gisRouteLength: string = gisRouteGISMiles.toFixed(2);

        return (masterRoute.RouteNumber === gisRoute.RouteNumber && masterRoute.Name === gisRoute.Name) && ((masterRoute.TxtBMP === gisRoute.TxtBMP && masterRoute.TxtEMP === gisRoute.TxtEMP) || (parseFloat(masterRouteLength) === parseFloat(gisRouteLength)));
      });
      if (matchingRoute) {
        matchingRoute['UniqIDGIS'] = gisRoute.UniqIDGIS;
        matchingRoute['MVUMdescription'] = gisRoute.MVUMdescription;
        matchingRoute['AltCSeasonalDates'] = gisRoute.AltCseaDates;
        if (matchingRoute.AltAmgt2 === 'No data' && gisRoute.MVUMdescription !== 'No data') {
          matchingRoute.AltAmgt2 = gisRoute.MVUMdescription;
          matchingRoute.AltAmgtPublic = gisRoute.MVUMdescription.toLowerCase().includes('open') ? 'Open to public motor vehicle use' : 'Closed to public motor vehicle use';
        }
        if (gisRoute.MVUMdescription === 'No data' && matchingRoute.AltAmgt2 !== 'No data') {
          matchingRoute.MVUMdescription = matchingRoute.AltAmgt2;
        }
      }
    });
  }

  private async addFEISData() {
    const feisActionRoutes = await this.http.get<any[]>('assets/data/feisAction.json').toPromise();
    const feisGISRoutes = await this.http.get<any[]>('assets/data/feisRoutes.json').toPromise();

    feisActionRoutes.forEach(feisRoute => {
      // Add in fields FEIS routes don't have.
      feisRoute['AltAmgt1'] = 'Keep as is';
      feisRoute['AltAmgt2'] = 'No data';
      feisRoute['AltAmgt3'] = 'No data';
      feisRoute['AltAmgtSea'] = 'No data';
      feisRoute['AltAmgtPublic'] = 'No data';
      feisRoute['AltC'] = 'No data';
      feisRoute['AltCmgt1'] = 'No data';
      feisRoute['AltCmgt2'] = 'No data';
      feisRoute['AltCmgt3'] = 'No data';
      feisRoute['AltCmgtSea'] = 'No data';
      feisRoute['AltCmgtPublic'] = 'No data';
      feisRoute['AltCSeasonalDates'] = 'No data';
      feisRoute['WildlifeData'] = [];
      feisRoute['UniqIDGIS'] = null;
      feisRoute['TAPsurfTy'] = 'No data';
      feisRoute['TAPcmnts'] = 'No data';;
      feisRoute['CurrMTC'] = 'No data';;
      feisRoute['DesiredMTC'] = 'No data';;
      feisRoute['County'] = 'UNKNOWN';

      // Add in FEIS GIS data fields
      let gisMatchingRoute = feisGISRoutes.find(gisRoute => {
        return gisRoute.RouteNumber === feisRoute.RouteNumber && gisRoute.Name === feisRoute.Name && ((gisRoute.BMP === feisRoute.TxtBMP || gisRoute.EMP === feisRoute.TxtEMP) || (gisRoute.SegLenth === feisRoute.TxtSegMi));
      });

      if (gisMatchingRoute) {
        feisRoute['MVUMdescription'] = gisMatchingRoute.MVUMdescription || 'No data';
        feisRoute['AltFseaDates'] = gisMatchingRoute.AltFseaDates || 'No data';
        feisRoute['AltFmod'] = gisMatchingRoute.AltFmod;
        feisRoute['AltF2020ModNo'] = gisMatchingRoute.AltF2020ModNo;
        if (feisRoute.MVUMdescription !== 'No data') {
          feisRoute.AltAmgt2 = feisRoute.MVUMdescription;
          feisRoute.AltAmgtPublic = feisRoute.MVUMdescription.toLowerCase().includes('open') ? 'Open to public motor vehicle use' : 'Closed to public motor vehicle use';
        }
      } else {
        feisRoute['MVUMdescription'] = 'No data';
        feisRoute['AltFseaDates'] = 'No data';
        feisRoute['AltFmod'] = '';
        feisRoute['AltF2020ModNo'] = '';
      }

      // Add FIES route to master route list
      let matchingRoute = this.combinedRoutes.find(masterRoute => {
        return masterRoute.RouteNumber === feisRoute.RouteNumber && masterRoute.Name === feisRoute.Name && masterRoute.TxtBMP === feisRoute.TxtBMP && masterRoute.TxtEMP === feisRoute.TxtEMP;
      });

      if (matchingRoute) {
        matchingRoute['AltF'] = feisRoute.AltF;
        matchingRoute['AltFmgt1'] = feisRoute.AltFmgt1;
        matchingRoute['AltFmgt2'] = feisRoute.AltFmgt2;
        matchingRoute['AltFmgt3'] = feisRoute.AltFmgt3;
        matchingRoute['AltFmgtSea'] = feisRoute.AltFmgtSea;
        matchingRoute['AltFmgtPublic'] = feisRoute.AltFmgtPublic;
        matchingRoute['MVUMdescription'] = feisRoute.MVUMdescription;
        matchingRoute['AltFseaDates'] = feisRoute.AltFseaDates;
        matchingRoute['AltFmod'] = feisRoute.AltFmod;
        matchingRoute['AltF2020ModNo'] = feisRoute.AltF2020ModNo;
      } else {
        feisRoute['ID'] = this.combinedRoutes.length + 1;
        this.combinedRoutes.push(feisRoute);
      }
    });
  }

  public async getRoutes() {
    if (this.combinedRoutes.length === 0) {
      const storedVersion = await get('dbVersion');
      if (storedVersion && storedVersion === dbVersion) {
        const storedRoutes: any = await get('combinedRoutes');
        const noActionRoutes: any = await get('noActionRoutes');
        if (storedRoutes && storedRoutes.length > 0) {
          this.combinedRoutes = storedRoutes;
          this.noActionRoutes = noActionRoutes;
        }
      }
    }

    if (this.combinedRoutes.length === 0) {
      await this.populateRoutes();
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
      let routeIsClosed = false;

      if (route['AltAmgtPublic'] !== 'No data' && route[altPublicParam] !== 'No data') {
        routeIsClosed = (route['AltAmgtPublic'] === 'Open to public motor vehicle use' && route[altPublicParam] !== 'Open to public motor vehicle use');
      } else if (route.MVUMdescription.includes('open') && route[altPublicParam] !== 'No data') {
        routeIsClosed = route[altPublicParam] !== 'Open to public motor vehicle use';
      } else if (route.MVUMdescription === 'No data') {
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

        const district = route['AdmRngDist'];
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
            E: '0.0',
            F: '0.0'
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
    const combinedRoutes = await this.getRoutes();
    const routes = alt === 'A' ? this.noActionRoutes : combinedRoutes;
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
      let district = route['AdmRngDist'];

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

  private addMvumRoute(route, type) {
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

  private async populateMvumRoutes() {
    const mvumRoads = await this.http.get<any[]>('assets/data/mvumRoads.json').toPromise();
    mvumRoads.forEach(road => {
      this.addMvumRoute(road, 'road');
    });

    const mvumTrails = await this.http.get<any[]>('assets/data/mvumTrails.json').toPromise();
    mvumTrails.forEach(trail => {
      this.addMvumRoute(trail, 'trail');
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

  public async getMvumRoutes() {
    if (!this.mvumRoutes.populated) {
      const storedRoutes: any = await get('mvumRoutes');
      if (storedRoutes && storedRoutes.populated) {
        this.mvumRoutes = storedRoutes;
      }
    }

    if (!this.mvumRoutes.populated) {
      await this.populateMvumRoutes();
    }

    return this.mvumRoutes;
  }
}
