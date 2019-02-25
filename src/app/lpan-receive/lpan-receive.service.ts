import {Injectable} from '@angular/core';
import {LpanDataFrame} from './LpanDataFrame';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {LinkHeader, IpPacket} from '../ip-packet/IpPacket';
import {Observable, Subject, throwError} from 'rxjs';
import {httpOptions, UrlService} from '../url/url.service';
import {catchError} from 'rxjs/operators';
import {MacReceiveService} from '../mac-receive/mac-receive.service';
import {MacIndication} from '../mac-receive/MacIndication';
import {MacId, macIdAsUrl} from '../mac/MacId';
import {RoutingTableService} from '../routing-table/routing-table.service';

@Injectable({
  providedIn: 'root'
})
export class LpanReceiveService {
  receivedPackets: Subject<IpPacket>;
  macId: MacId;
  macUrl: string;

  constructor(
    private http: HttpClient,
    private urlService: UrlService,
    private macService: MacReceiveService,
    private tableService: RoutingTableService) {
    this.receivedPackets = new Subject<IpPacket>();
  }

  start(macId: MacId) {
    this.macId = macId;
    this.macUrl = macIdAsUrl(macId);
    this.macService.subscribeMacIndications(this.macUrl)
      .subscribe(
        nextInd => this.onMacInd(nextInd),
        error => this.onMacError(error)
      );
  }

  private onMacInd(nextInd: MacIndication): void {
    if (nextInd != null) {
      this.tableService.logNeighbourQuality(nextInd.sourceAddress, nextInd.quality);
      const frame = new LpanDataFrame();
      frame.linkHeader = new LinkHeader();
      frame.linkHeader.linkDestination = nextInd.destAddress;
      frame.linkHeader.panId = this.macId.panId;
      frame.linkHeader.channel = this.macId.channel;
      frame.linkHeader.linkSource = nextInd.sourceAddress;
      frame.data = nextInd.data;
      this.tryComposePacket(this.macUrl, frame, this.onComposedPacket.bind(this));
    }
  }


  private onMacError(error: any) {
    console.log(error.toLocaleString());
  }

  tryComposePacket(macUrl: string,
                   frame: LpanDataFrame,
                   onResponse: (frame: LpanDataFrame,
                                packet: IpPacket) => void): void {

    this.composePacket(macUrl, frame).subscribe(
      composed => onResponse(frame, composed),
      error => {
        const errorGram = new IpPacket();
        errorGram.response = error.error;
        errorGram.linkHeader = frame.linkHeader;
        onResponse(frame, errorGram);
      }
    );

  }

  composePacket(macUrl: string, frame: LpanDataFrame): Observable<IpPacket> {
    const url = this.urlService.httpUrl + 'lpan/toPacket/' + macUrl;
    return this.http.post<IpPacket>(url, frame, httpOptions)
      .pipe(catchError(this.onComposeError));
  }

  private onComposeError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      error.error);
  }

  private onComposedPacket(frame: LpanDataFrame,
                           packet: IpPacket): void {

    if (packet.payload != null) {
      this.receivedPackets.next(packet);
    }
  }
}
