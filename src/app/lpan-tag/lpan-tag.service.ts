import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LpanTagService {

  private tag = 1;
  constructor() { }

  nextTag(): number {
    return this.tag++;
  }
}
