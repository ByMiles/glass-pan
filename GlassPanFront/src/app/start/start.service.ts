import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {MacId} from '../mac/MacId';
import {ServiceDesc} from '../url/ServiceDesc';
import {httpOptions, UrlService} from '../url/url.service';
import {Observable, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {MacService} from '../mac/mac.service';

@Injectable({
  providedIn: 'root'
})
export class StartService {

  desc: ServiceDesc;
  constructor(private http: HttpClient,
              private urlService: UrlService,
              private macService: MacService) {
    this.desc = urlService.desc;
  }

  tryStart(macId: MacId, onConfirmation: (message: string) => void): void {
    this.start(macId).subscribe(
      response => {
        this.onStartSuccess(response);
        onConfirmation('SUCCESS');
        },
          error => {
        onConfirmation(error);
          }
    );
  }

  private start (macId: MacId): Observable<MacId> {
    return this.http.post<MacId>(this.urlService.httpUrl + 'mac/start', macId, httpOptions)
      .pipe(catchError(this.onStartError));
  }

  private onStartSuccess(response: MacId): void {
    this.macService.addMacId(response);
  }
  private onStartError(error: HttpErrorResponse) {
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
    return throwError(error.error);
  }

}
