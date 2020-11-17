import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SummaryComponent } from './summary/summary.component';
import { MapsComponent } from './maps/maps.component';
import { RouteListComponent } from './route-list/route-list.component';
import { ProfileComponent } from './profile/profile.component';
import { PreferredDetailComponent } from './preferred-detail/preferred-detail.component';
import { DecisionComponent } from './decision/decision.component';
import { ResourcesComponent } from './resources/resources.component';
import { AboutComponent } from './about/about.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  { path: 'summary', component:  SummaryComponent},
  { path: 'routes', component:  RouteListComponent},
  { path: 'routes/profile/:id', component:  ProfileComponent},
  { path: 'maps', component:  MapsComponent},
  { path: 'preferred', component:  PreferredDetailComponent},
  { path: 'decision', component:  DecisionComponent},
  { path: 'resources', component:  ResourcesComponent},
  { path: 'about', component:  AboutComponent},
  { path: '',
    redirectTo: '/summary',
    pathMatch: 'full'
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
