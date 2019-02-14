import { Component } from '@angular/core';
import {UrlService} from './url/url.service';
import {MacService} from './mac/mac.service';
import {StartService} from './start/start.service';
import {B64Util} from './util/B64Util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'GlassPanFront';

  constructor(private url: UrlService, private mac: MacService, private start: StartService) {
  }
}
