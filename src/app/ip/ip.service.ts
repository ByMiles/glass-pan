import {EventEmitter, Injectable} from '@angular/core';
import {MacId, macIdAsUrl} from '../mac/MacId';
import {IpHeader, IpPacket} from '../ip-packet/IpPacket';
import {B64Util} from '../util/B64Util';
import {DemoService} from '../demo/demo.service';
import {MacSendService} from '../mac-send/mac-send.service';
import {MacReceiveService} from '../mac-receive/mac-receive.service';
import {LpanSendService} from '../lpan-send/lpan-send.service';
import {LpanReceiveService} from '../lpan-receive/lpan-receive.service';
import {Subject} from 'rxjs';
import {RoutingTableService} from '../routing-table/routing-table.service';

export const ALL_RPL_ROUTER = 'ff02::1a';
export const ALL_COAP_DEVICES = 'ff02::fd';
export const UNICAST_PREFIX = 'fe80::ff:fe00:';

@Injectable({
  providedIn: 'root'
})
export class IpService {

  isDemo: boolean;
  macId: MacId;
  macUrl: string;
  packetIndications: Subject<IpPacket>;
  unreachableEvents: EventEmitter<IpHeader>;

  constructor(private demoService: DemoService,
              private lpanSendService: LpanSendService,
              private lpanReceiveService: LpanReceiveService,
              private tableService: RoutingTableService) {
    this.packetIndications = new Subject<IpPacket>();
    this.unreachableEvents = new EventEmitter<IpHeader>();
  }

  start(macId: MacId, isDemo: boolean): void {
    this.macId = macId;
    this.macUrl = macIdAsUrl(macId);
    this.isDemo = isDemo;
    if (isDemo) {
      this.subscribeDemoIndications();
    } else {
      this.lpanReceiveService.start(macId);
      this.subscribeSerialIndications();
    }
  }

  trySendPacket(packet: IpPacket, onConfirmation: ((packet: IpPacket) => void)) {

    if (!(packet.payload.payload.length < 8)
      && (packet.linkHeader = this.tableService.getLinkHeader(packet.v6Header.sourceAddress, packet.v6Header.destAddress)) != null) {
      if (this.isDemo) {
        this.demoService.trySendPacket(
          packet,
          onConfirmation);
      } else {
        this.lpanSendService.trySendAsFrames(
          this.macUrl,
          packet,
          onConfirmation);
      }
    }
  }

  private subscribeDemoIndications() {
   this.demoService.subscribePacketIndications(this.macId)
      .subscribe(
        nextPacket => this.onPacketIndication(nextPacket)
      );
  }

  private subscribeSerialIndications() {
    this.lpanReceiveService.receivedPackets
      .subscribe(
        nextPacket => this.onPacketIndication(nextPacket)
      );
  }

  private onPacketIndication(nextPacket: IpPacket) {
    this.packetIndications.next(nextPacket);
  }
}
