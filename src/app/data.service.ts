import { Injectable } from '@angular/core';
import actionRoutes from '../data/action.json';
import noActionRoutes from '../data/noAction.json';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private combinedRoutes = [];

  constructor () {

  }

  private populateRoutes() {
    this.combinedRoutes = actionRoutes.map(actionRoute => {
      let matchingRoute = noActionRoutes.find(noActionRoute => {
        return noActionRoute.RouteNumber === actionRoute.RouteNumber && noActionRoute.Name === actionRoute.Name && noActionRoute.MgtRngDist === actionRoute.MgtRngDist && noActionRoute.GIS_Miles === actionRoute.TxtSegMi;
      });
      matchingRoute = matchingRoute || noActionRoutes.find(noActionRoute => {
        return noActionRoute.RouteNumber === actionRoute.RouteNumber && noActionRoute.Name === actionRoute.Name && noActionRoute.MgtRngDist === actionRoute.MgtRngDist;
      });
      if (matchingRoute) {
        let combinedRoute = actionRoute;
        combinedRoute["AltAmgt1"] = matchingRoute.AltAmgt1;
        combinedRoute["AltAmgt2"] = matchingRoute.AltAmgt2;
        combinedRoute["AltAmgt3"] = matchingRoute.AltAmgt3;
        combinedRoute["AltAmgtSea"] = matchingRoute.AltAmgtSea;
        combinedRoute["AltAmgtPublic"] = matchingRoute.AltAmgtPublic;
        return combinedRoute;
      } else {
        let combinedRoute = actionRoute;
        combinedRoute["AltAmgt1"] = "No data";
        combinedRoute["AltAmgt2"] = "No data";
        combinedRoute["AltAmgt3"] = "No data";
        combinedRoute["AltAmgtSea"] = "No data";
        combinedRoute["AltAmgtPublic"] = "No data";
        return combinedRoute;
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
