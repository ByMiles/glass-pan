import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {IpPacket} from '../ip-packet/IpPacket';
import {MacFrame} from '../mac-send/MacFrame';
import {Observable, throwError} from 'rxjs';
import {httpOptions, UrlService} from '../url/url.service';
import {catchError} from 'rxjs/operators';
import {IpFragments, packetFragmentsToMacFrames} from './IpFragments';
import {MacSendService} from '../mac-send/mac-send.service';


@Injectable({
  providedIn: 'root'
})
export class LpanSendService {

  constructor(private http: HttpClient,
              private urlService: UrlService,
              private macService: MacSendService) {
  }

  tryTransformToFrames(composed: IpPacket,
                       onConfirmation:
                         (composed: IpPacket,
                          frames: MacFrame[],
                          response: string)
                           => void) {
    this.transformToFrames(composed).subscribe(
      next => {
        if (next != null) {
          const frames = packetFragmentsToMacFrames(next);
          onConfirmation(composed, frames, next.response);
        } else {
          onConfirmation(composed, null, 'Something was wrong');
        }
      },
      error => onConfirmation(composed, null, error));
  }

  transformToFrames(composed: IpPacket): Observable<IpFragments> {
    const url = this.urlService.httpUrl + 'lpan/toFrame';
    return this.http.post<IpFragments>(url, composed, httpOptions)
      .pipe(catchError(this.onTransformError));
  }

  onTransformError(error: HttpErrorResponse) {
    const errorPacket = new IpFragments();
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
      errorPacket.response = 'ERROR: ' + error.error.message;
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
      errorPacket.response = 'ERROR: ' + error.error;
    }
    // return an observable with a user-facing error message
    return throwError(
      error.error);
  }

  trySendAsFrames(
    macUrl: string,
    composed: IpPacket,
    onConfirmation: (
      (composed: IpPacket)
        => void
      )
  ): void {
    this.transformToFrames(composed).subscribe (
      transformed => {
        if (transformed != null
          && transformed.fragments != null
          && transformed.fragments.length > 0) {

          // => frames are fine
          this.macService.sendMacFrames(macUrl, packetFragmentsToMacFrames(transformed))
            .subscribe(
              // => frames may be sent
              response => {
                composed.response = response;
                onConfirmation(composed);
              } ,
              //  =>frames are not sent
              error => {
                composed.response = error.toLocaleString();
                onConfirmation(composed);
              }
            );
        } else {
          // => frames are not fine
          composed.response = (transformed == null || transformed.response == null)
            ? 'ERROR: transformation failed'
            : transformed.response;
          onConfirmation(composed);
        }
      } ,
      error => {
        composed.response = error.toLocaleString();
        onConfirmation(composed);
      }
    );
  }
}
