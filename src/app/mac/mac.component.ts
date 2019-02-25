import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-mac',
  templateUrl: './mac.component.html',
  styleUrls: ['./mac.component.scss']
})
export class MacComponent implements OnInit {

  macUrl: string;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.macUrl = this.route.snapshot.paramMap.get('channel') + '/'
      + this.route.snapshot.paramMap.get('panId') + '/'
      + this.route.snapshot.paramMap.get('address');
  }

}
