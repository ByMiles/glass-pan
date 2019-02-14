import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {MacIndication} from './MacIndication';
import {UrlService} from '../url/url.service';
import {createSubject, createWebSocket} from '../util/websocket-util';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MacReceiveService {

  constructor(private urlService: UrlService) {
  }

  subscribeMacIndications(macUrl: string): Observable<MacIndication> {
    const url = this.urlService.wsUrl + 'mac/' + macUrl;
    return createSubject(createWebSocket(url)).asObservable()
      .pipe(map((response: MessageEvent): MacIndication =>
        this.routeIndications(response.data, macUrl)));
  }

  private routeIndications(data: string, macUrl: string) {
    if (data.startsWith('{')) {
      return JSON.parse(data);
    } else {
      console.log('mac-Indication message: ' + data);
    }
  }
}
