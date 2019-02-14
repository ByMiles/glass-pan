import { Injectable } from '@angular/core';
import {HttpUrl, ServiceDesc, WsUrl} from './ServiceDesc';
import {HttpHeaders} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';

export const defaultDomain = 'localhost';
export const defaultSocketPort = 8889;
export const defaultRestPort = 8887;

export const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  })
};

export const observeOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  }),
  responseType: 'text' as 'json',
};
@Injectable({
  providedIn: 'root'
})
export class UrlService {

  wsUrl: string;
  httpUrl: string;
  desc: ServiceDesc;
  isUrlSet: BehaviorSubject<boolean>;

  constructor() {
    this.desc = new ServiceDesc();
  this.desc.domain = defaultDomain;
  this.desc.wsPort = defaultSocketPort;
  this.desc.httpPort = defaultRestPort;
  this.isUrlSet = new BehaviorSubject<boolean>(false);
  this.updateDesc();
  }

  updateDesc(): void {
    if (this.desc.domain == null
      || this.desc.httpPort < 0 || this.desc.wsPort < 0
      || this.desc.httpPort > 65354 || this.desc.wsPort > 65354) {
      this.isUrlSet.next(false);
    }
    this.httpUrl = HttpUrl(this.desc);
    this.wsUrl = WsUrl(this.desc);
    this.isUrlSet.next(true);
  }
}
