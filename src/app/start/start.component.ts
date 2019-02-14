import {Component, OnInit} from '@angular/core';
import {StartService} from './start.service';
import {
  defaultAddress,
  defaultChannel,
  defaultPanId, MacService,
} from '../mac/mac.service';
import {MacId, macIdAsUrl} from '../mac/MacId';
import {UrlService} from '../url/url.service';
import {applySourceSpanToExpressionIfNeeded} from '@angular/compiler/src/output/output_ast';
import {DemoService} from '../demo/demo.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.scss']
})
export class StartComponent implements OnInit {

  status: string;
  macId: MacId;
  macIds: MacId[];
  demoLinks: string[];
  startAsDemo: boolean;
  startCount = 0;

  constructor(
    private startService: StartService,
    private macService: MacService,
    private urlService: UrlService) {
    this.initMacId();
    macService.macIds.asObservable().subscribe(ids => this.macIds = ids);
    this.urlService.isUrlSet.subscribe(isSet => this.onUrlChange(isSet));
  }

  ngOnInit() {
  }

  start() {
    this.startService.tryStart(this.macId, this.updateStatus.bind(this));
    this.initMacId();
  }

  updateStatus(newStatus: string): void {
    this.status = newStatus;
  }

  private onUrlChange(isSet: boolean) {
    if (isSet) {
      this.macService.tryGetMacIds(this.updateStatus.bind(this));
    }
  }

  private initMacId() {
    this.macId = new MacId();
    this.macId.channel = defaultChannel;
    this.macId.panId = defaultPanId;
    this.macId.address = defaultAddress + this.startCount++;
  }
}
