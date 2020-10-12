import { switchMap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../data.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.sass']
})
export class ProfileComponent implements OnInit {
  road

  constructor (
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(async params => {
      this.road = await this.dataService.getRouteById(params.get('id'));
      console.log(this.road);
    });
  }
}
