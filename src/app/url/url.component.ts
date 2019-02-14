import { Component, OnInit } from '@angular/core';
import {ServiceDesc} from './ServiceDesc';
import {UrlService} from './url.service';

@Component({
  selector: 'app-url',
  templateUrl: './url.component.html',
  styleUrls: ['./url.component.scss']
})
export class UrlComponent implements OnInit {

  desc: ServiceDesc;
  httpUrl: string;
  wsUrl: string;
  constructor(private urlService: UrlService) {
    this.desc = urlService.desc;
    this.httpUrl = urlService.httpUrl;
    this.wsUrl = urlService.wsUrl;
  }

  ngOnInit() {
  }

  updateDesc(): void {
    this.urlService.updateDesc();
    this.httpUrl = this.urlService.httpUrl;
    this.wsUrl = this.urlService.wsUrl;
  }

}
