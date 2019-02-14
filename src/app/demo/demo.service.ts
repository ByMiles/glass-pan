import {Injectable} from '@angular/core';
import {MacId} from '../mac/MacId';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {linkHeaderAsLinkUrl, IpPacket} from '../ip-packet/IpPacket';
import {RoutingTableService} from '../routing-table/routing-table.service';

export const DEMO_PORT = 0xf0b1; // compressible to 4 bit = 1;
@Injectable({
  providedIn: 'root'
})

export class DemoService {

  receivedPackets: Subject<IpPacket>;
  private macId: MacId;
  private localLinks: Map<string, number>;
  demoLinks: BehaviorSubject<Map<string, number>>;
  packetChannel: BroadcastChannel;
  linkChannel: BroadcastChannel;
  startChannel: BroadcastChannel;
  isMaster: boolean;
  demoQualities: BehaviorSubject<number[]>;

  constructor(private tableService: RoutingTableService) {
    console.log('FRESH OUT');
    this.isMaster = false;
    this.startChannel = new BroadcastChannel('start');
    this.startChannel.onmessage = this.onStart.bind(this);
    this.packetChannel = new BroadcastChannel('packets');
    this.packetChannel.onmessage = this.onPacket.bind(this);
    this.receivedPackets = new Subject<IpPacket>();
    this.linkChannel = new BroadcastChannel('links');
    this.linkChannel.onmessage = this.onLinks.bind(this);
    this.localLinks = new Map<string, number>();
    this.demoLinks = new BehaviorSubject<Map<string, number>>(this.localLinks);
    this.startChannel.postMessage('hi');
  }

  onPacket(e) {
    if (!this.isMaster && this.isForUs(e.data)) {
      this.tableService.logNeighbourQuality(
        e.data.linkHeader.linkSource,
        this.localLinks.get(
          this.macId.channel + '/' + this.macId.panId + '/' + e.data.linkHeader.linkSource + '/' + this.macId.address
        )
      );
      this.receivedPackets.next(e.data);
    }
  }

  onLinks(e) {
    if (!this.isMaster) {
      this.localLinks = e.data;
    }
  }

  onStart(e) {
    if (this.isMaster) {
      this.linkChannel.postMessage(this.localLinks);
    }
  }

  subscribePacketIndications(macId: MacId): Observable<IpPacket> {
    if (!this.isMaster) {
      this.macId = macId;
      return this.receivedPackets.asObservable();
    }
  }

  setLocalLink(link: string): void {
    console.log('set llink: ' + link);
    if (this.isMaster && !this.localLinks.has(link)) {
      this.localLinks.set(link, 150);
      this.linkChannel.postMessage(this.localLinks);
    }
  }

  removeLocalLink(link: string): void {
    if (this.isMaster && this.localLinks.has(link)) {
      if (this.isMaster) {
        this.localLinks.delete(link);
        this.linkChannel.postMessage(this.localLinks);
      }
    }
  }

  trySendPacket(
    packet: IpPacket,
    onConfirmation: (
      (composed: IpPacket) => void)
  ): void {
    const linkKey = linkHeaderAsLinkUrl(packet.linkHeader);
    console.log('send: ' + linkKey);
    console.log('links: ' + this.localLinks.toLocaleString());
    if (this.localLinks.has(linkKey)
      || packet.linkHeader.linkDestination === 0xffff) {
      this.packetChannel.postMessage(packet);
      packet.response = 'SUCCESS';
    } else {
      packet.response = 'UNREACHABLE';
    }
    onConfirmation(packet);
  }

  private isForUs(data: IpPacket) {
    return data.linkHeader.channel === this.macId.channel
      && data.linkHeader.panId === this.macId.panId
      && (data.linkHeader.linkDestination === this.macId.address
        || (data.linkHeader.linkDestination === 0xffff
          && data.linkHeader.linkSource !== this.macId.address
          && this.localLinks.has(
            this.macId.channel + '/'
            + this.macId.panId + '/'
            + data.linkHeader.linkSource + '/'
            + this.macId.address)));
  }

  setMaster() {
    this.isMaster = true;
  }

  updateQuality(link: string, number: number) {
    this.localLinks.set(link, number);
    this.demoLinks.next(this.localLinks);
  }
}
