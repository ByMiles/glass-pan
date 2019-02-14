import { Injectable } from '@angular/core';
import {observeOptions, UrlService} from '../url/url.service';
import {MacFrame} from './MacFrame';
import {Observable, throwError} from 'rxjs';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, tap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MacSendService {

  constructor(private urlService: UrlService, private http: HttpClient) { }

  trySendMacFrames(macUrl: string, frames: MacFrame[], onConfirmation: (result: string, frames: MacFrame[]) => void ) {

    this.sendMacFrames(macUrl, frames).subscribe(
      response => onConfirmation(response, frames),
      error => onConfirmation(error.message, frames)
    );
  }

  sendMacFrames(macUrl: string, frames: MacFrame[]): Observable<any> { // returns <string> | <error>
console.log('MAC DA');
    const url = this.urlService.httpUrl + 'mac/' + macUrl;
    return this.http.post(url, JSON.stringify(frames), observeOptions)
      .pipe(catchError(this.onSendError));
  }

  private onSendError(error: HttpErrorResponse) {
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
}
