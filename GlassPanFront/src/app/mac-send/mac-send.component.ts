import {Component, Input, OnInit} from '@angular/core';
import {MacFrame} from './MacFrame';
import {MacSendService} from './mac-send.service';
import {B64Util} from '../util/B64Util';



@Component({
  selector: 'app-mac-send',
  templateUrl: './mac-send.component.html',
  styleUrls: ['./mac-send.component.scss']
})
export class MacSendComponent implements OnInit {

  @Input() macUrl: string;

  frames: MacFrame[][];
  failedFrames: MacFrame[];
  failedStatus: string;
  bodies: string[];
  testCount = 0;
  private destPanId: number;
  private destAddress: number;

  constructor(private sendService: MacSendService) {
    this.frames = [];
    this.clearBodies();
  }

  ngOnInit() {
  }

  private clearBodies() {
    this.testCount++;
    this.bodies = [];
    this.addBody();
  }

  addBody (): void {
    this.bodies.push('test: ' + this.testCount + ' body: ' + this.bodies.length + 1);
  }

  sendFrames(): void {
    const nextFrames = [];
    this.bodies.forEach((value, index, array) => {
      const aFrame = new MacFrame();
      aFrame.destPanId = this.destPanId;
      aFrame.destAddress = this.destAddress;
      aFrame.data = B64Util.unicodeToB64(value);
      nextFrames.push(aFrame);
    } );
    this.sendService.trySendMacFrames(this.macUrl, nextFrames, this.onConfirmation.bind(this));
    this.clearBodies();
  }

  onConfirmation (status: string, lastFrames: MacFrame[]): void {
    if (status === 'SUCCESS' && lastFrames != null) {
      lastFrames.forEach((value, index, array) =>
      value.data = B64Util.b64ToUnicode(value.data));
      this.frames.push(lastFrames);
    } else {
      this.failedFrames = lastFrames;
    }
    this.failedStatus = status;
  }
}
