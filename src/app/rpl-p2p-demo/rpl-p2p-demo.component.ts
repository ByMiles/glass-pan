import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {IpService, UNICAST_PREFIX} from '../ip/ip.service';
import {RplP2pDemoService} from './rpl-p2p-demo.service';
import {MacId} from '../mac/MacId';
import {RoutingTableService} from '../routing-table/routing-table.service';
import {ActivatedRoute} from '@angular/router';
import {IpPacket, LinkHeader, IpHeader} from '../ip-packet/IpPacket';
import {DEMO_PORT} from '../demo/demo.service';
import {UdpGenerator} from './UdpGenerator';
import {B64Util} from '../util/B64Util';

@Component({
  selector: 'app-rpl-p2p-demo',
  templateUrl: './rpl-p2p-demo.component.html',
  styleUrls: ['./rpl-p2p-demo.component.scss']
})
export class RplP2pDemoComponent implements OnInit {

  localInterface: string;
  macId: MacId;
  addressStub = UNICAST_PREFIX;
  significant: string;
  target: string;
  isValid: boolean;
  startTime: number;
  demoPort = DEMO_PORT;
  message: string;
  responseLog: string[];
  indicationLog: { source: string, message: string }[];

  openMessages: Map<string, IpPacket[]>;

  constructor(private p2p: RplP2pDemoService,
              private tableService: RoutingTableService,
              private route: ActivatedRoute,
              private ipService: IpService,
              private ref: ChangeDetectorRef) {
    this.responseLog = [];
    this.indicationLog = [];
    this.openMessages = new Map<string, IpPacket[]>();
  }

  ngOnInit() {
    this.macId = new MacId();
    this.macId.channel = +this.route.snapshot.paramMap.get('channel');
    this.macId.panId = +this.route.snapshot.paramMap.get('panId');
    this.macId.address = +this.route.snapshot.paramMap.get('address');
    this.localInterface = UNICAST_PREFIX + this.macId.address.toString(16);
    this.tableService.interfaceId = this.localInterface;
    this.tableService.macId = this.macId;
    const multicastLinkHeader = new LinkHeader();
    multicastLinkHeader.channel = this.macId.channel;
    multicastLinkHeader.panId = this.macId.panId;
    multicastLinkHeader.linkSource = this.macId.address;
    multicastLinkHeader.linkDestination = 0xffff;
    this.tableService.multicastLinkHeader = multicastLinkHeader;

    this.ipService.start(this.macId, (this.route.snapshot.paramMap.get('mode') === 'demo'));
    this.p2p.udpIndications.asObservable().subscribe(
      nextDatagram => this.handleUdpIndication(nextDatagram));
  }

  onDiscoveryEnd(target: string, isFound: boolean):
    void {
    console.log('found: ' + target + ' ' + isFound + '(' + ((Date.now() - this.startTime) / 1000) + ' secs)');
  }

  startDiscovery() {
    if (this.isValid) {
      this.startTime = Date.now();
      this.p2p.discover(this.target, this.onDiscoveryEnd.bind(this));
    }
  }

  onTargetChange() {
    const asNumber = parseInt(this.significant, 16);

    if (asNumber != null && asNumber > 0 && asNumber < 65355) {
      this.target = UNICAST_PREFIX + this.significant;
      this.isValid = true;
    } else {
      this.isValid = false;
    }
  }

  sendDatagram() {
    if (this.isValid) {
      const datagram = UdpGenerator.udpDatagram(DEMO_PORT, DEMO_PORT, B64Util.unicodeToB64(this.message));
      const packet = new IpPacket();
      packet.payload = datagram;
      packet.v6Header = new IpHeader();
      packet.v6Header.destAddress = this.target;
      packet.v6Header.sourceAddress = this.tableService.interfaceId;
      if (this.openMessages.has(this.target)) {
        this.openMessages.get(this.target).push(packet);
      } else {
        const messageList = [];
        messageList.push(packet);
        this.openMessages.set(this.target, messageList);
        this.p2p.discover(this.target, this.onTargetDiscovered.bind(this));
      }
    }
  }

  onTargetDiscovered(target: string, isFound: boolean) {
    if (isFound) {
      const packets = this.openMessages.get(target);
      if (packets != null) {
        packets.forEach(storedPacket => {
          storedPacket.v6Header.hopLimit = this.tableService.getHopLimit(
            storedPacket.v6Header.sourceAddress,
            storedPacket.v6Header.destAddress
          );
          if (storedPacket.v6Header.hopLimit != null) {
            this.ipService.trySendPacket(
              storedPacket,
              (respondedPacket => {
                this.responseLog.push(respondedPacket.response);
                this.ref.detectChanges();
              })
            );
          } else {
            this.responseLog.push('table entry is missing: ' + target);
            this.ref.detectChanges();
          }
        });
      }
    }
  }

  private handleUdpIndication(nextDatagram: IpPacket) {
    const message = B64Util.b64ToUnicode(UdpGenerator.udpMessage(nextDatagram.payload));
    this.indicationLog.push({source: nextDatagram.v6Header.sourceAddress, message: message});
    this.ref.detectChanges();
  }
}
