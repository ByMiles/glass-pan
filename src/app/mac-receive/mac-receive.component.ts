import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {MacReceiveService} from './mac-receive.service';
import {MacIndication} from './MacIndication';
import {Subscription} from 'rxjs';
import {NavigationEnd, Route, Router} from '@angular/router';
import {B64Util} from '../util/B64Util';

@Component({
  selector: 'app-mac-receive',
  templateUrl: './mac-receive.component.html',
  styleUrls: ['./mac-receive.component.scss']
})
export class MacReceiveComponent implements OnInit, OnDestroy {

  @Input() macUrl: string;
  inds: MacIndication[];
  indSubscriptions: Subscription;

  constructor(private receiveService: MacReceiveService, private router: Router) {
    this.inds = [];
  }

  ngOnInit() {
   this.indSubscriptions = this.receiveService.subscribeMacIndications(this.macUrl)
      .subscribe(ind => {
          if (ind == null) {
          } else {
            ind.data = B64Util.b64ToUnicode(ind.data);
            this.inds.push(ind);
          }
        }
        ,
        error => console.log('Indication error: (' + error.toLocaleString() + ') => ' + this.macUrl),
        () => console.log('Indication completed: => ' + this.macUrl)
      );
  }
  ngOnDestroy() {
    this.indSubscriptions.unsubscribe();
  }
}

