import { Injectable } from '@angular/core';
import {httpOptions, UrlService} from '../url/url.service';
import {MacId, macIdAsUrl} from './MacId';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';


export const defaultChannel = 11;
export const defaultPanId = 1;
export const defaultAddress = 1;

@Injectable({
  providedIn: 'root'
})
export class MacService {

  macIds: BehaviorSubject<MacId[]>;
  private macIdList: MacId[];

  constructor(private urlService: UrlService, private http: HttpClient) {
    this.macIds = new BehaviorSubject<MacId[]>([]);
  }

  addMacId(macId: MacId) {
    this.macIdList.push(macId);
    this.macIds.next(Array.from(this.macIdList));
  }

  tryGetMacIds(onConfirmation: (message: string) => void): void {
    this.getMacIds().subscribe(
      response => {
        this.onGetMacIdsSuccess(response);
        onConfirmation('SUCCESS');
      },
        error => onConfirmation(error.message)
    );
  }

  private getMacIds(): Observable<MacId[]> {
    const url = this.urlService.httpUrl + 'mac';
    return this.http.get<MacId[]>(url, httpOptions);
  }

  private onGetMacIdsSuccess(macIds: MacId[]) {
    this.macIdList = macIds;
    this.macIds.next(Array.from(this.macIdList));
  }
}
