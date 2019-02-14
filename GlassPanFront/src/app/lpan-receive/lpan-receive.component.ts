import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {LinkHeader, IpPacket} from '../ip-packet/IpPacket';
import {MacReceiveService} from '../mac-receive/mac-receive.service';
import {MacId, macIdAsUrl} from '../mac/MacId';
import {MacIndication} from '../mac-receive/MacIndication';
import {LpanReceiveService} from './lpan-receive.service';
import {LpanDataFrame} from './LpanDataFrame';
import {B64Util} from '../util/B64Util';
import {DemoService} from '../demo/demo.service';

@Component({
  selector: 'app-lpan-receive',
  templateUrl: './lpan-receive.component.html',
  styleUrls: ['./lpan-receive.component.scss']
})
export class LpanReceiveComponent implements OnInit {

  @Input() macId: MacId;
  @Input() isDemo: boolean;
  private macUrl: string;
  receivedPackets: IpPacket[];
  private emptyResponses: string[];
  constructor(private macService: MacReceiveService,
              private lpanService: LpanReceiveService,
              private demoService: DemoService,
              private ref: ChangeDetectorRef) {
    this.receivedPackets = [];
    this.emptyResponses = [];
  }

  ngOnInit() {
    if (this.isDemo) {
      this.demoService.subscribePacketIndications(this.macId)
        .subscribe(
          nextInd => {
            console.log('pushed ind');
      this.receivedPackets.push(nextInd);
            this.ref.detectChanges();
    });
    } else {
      this.macUrl = macIdAsUrl(this.macId);
      this.macService.subscribeMacIndications(this.macUrl)
        .subscribe(
          nextInd => this.onMacInd(nextInd),
          error => this.onMacError(error)
        );
    }
  }

  private onMacInd(nextInd: MacIndication): void {
    console.log('mac indication ' + this.macUrl);
    if (nextInd != null) {
      const frame = new LpanDataFrame();
      frame.linkHeader = new LinkHeader();
      frame.linkHeader.linkDestination = nextInd.destAddress;
      frame.linkHeader.panId = this.macId.panId;
      frame.linkHeader.channel = this.macId.channel;
      frame.linkHeader.linkSource = nextInd.sourceAddress;
      frame.data = nextInd.data;
      console.log('frame data: ' + frame.data);
      this.lpanService.tryComposePacket(this.macUrl, frame, this.onComposedPacket.bind(this));
    }
  }

  private onMacError(error: any) {
    console.log(error.toLocaleString());
  }

  private onComposedPacket(frame: LpanDataFrame,
                             packet: IpPacket): void {
console.log('composed arrived');
    if (packet.payload != null) {
      console.log('composed has payload: ' + packet.payload.payload + ' ' + (packet.linkHeader != null));
      packet.payload.payload = B64Util.b64ToUnicode(packet.payload.payload);
      this.receivedPackets.push(packet);
    } else {
      this.emptyResponses.push(packet.response);
    }

  }
}
