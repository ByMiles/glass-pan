import {Injectable} from '@angular/core';
import {RoutingTableService} from '../routing-table/routing-table.service';
import {LinkHeader, IpHeader, IpPacket} from '../ip-packet/IpPacket';
import {
  ICMP_TYPE_RPL,
  ICMP_TYPE_UNREACHABLE,
  NEXT_HEADER_ICMP,
  NEXT_HEADER_UDP,
  RPL_CODE_DIO,
  RPL_CODE_DRO,
  RplP2PGenerator
} from './RplP2PGenerator';
import {ALL_RPL_ROUTER, IpService} from '../ip/ip.service';
import {B64Util} from '../util/B64Util';
import {RoutingTableEntry} from '../routing-table/RoutingTableEntry';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RplP2pDemoService {

  private rplGenerator: RplP2PGenerator;
  private readonly rplId: number;
  callbackMap: Map<string, ((address: string, found: boolean) => void)[]>;
  udpIndications: Subject<IpPacket>;

  constructor(private tableService: RoutingTableService,
              private ipService: IpService) {
    this.rplGenerator = new RplP2PGenerator();
    this.callbackMap = new Map<string, ((string, boolean) => void)[]>();
    this.rplId = this.tableService.rplId;
    this.udpIndications = new Subject<IpPacket>();
    this.ipService.packetIndications.asObservable().subscribe(
      next => {
        this.handleIndication(next);
      }
    );
  }

  discover (
    address: string,
    onFindStatus: ((address: string, found: boolean) => void)
  ): void {
    if (this.tableService.hasRoute(address)) {
      onFindStatus(address, true);

    } else if (this.callbackMap.has(address)) {
      this.callbackMap.get(address).push(onFindStatus);
    } else {

      const entry = new RoutingTableEntry();
      entry.rootAddress = this.tableService.interfaceId;
      entry.rplId = this.rplId;
      entry.childAddress = address;
      entry.routeKey = entry.rootAddress + '/' + entry.childAddress;

      if (this.tableService.discoverAsRoot(entry)) {

        const callbackList = [];
        callbackList.push(onFindStatus);
        this.callbackMap.set(address, callbackList);
      }
      const packet = new IpPacket();
      packet.v6Header = new IpHeader();
      packet.v6Header.destAddress = ALL_RPL_ROUTER;
      packet.v6Header.sourceAddress = this.tableService.interfaceId;
      packet.v6Header.hopLimit = 5;
      packet.payload = this.rplGenerator.startPathDiscoveryDio(this.tableService.interfaceId, address, this.rplId);
      this.ipService.trySendPacket(packet, this.onSentRootDiscoveryDio.bind(this));
    }
  }

  private handleIndication(packetInd: IpPacket) {
    switch (packetInd.payload.protocol) {
      case NEXT_HEADER_ICMP:
        this.handleIcmpIndication(packetInd);
        break;
      case NEXT_HEADER_UDP:
        this.handleUdpIndication(packetInd);
        break;
    }
  }

  private handleIcmpIndication(packetInd: IpPacket) {

    const decoded = B64Util.b64ToBuffer(packetInd.payload.payload);
    switch (decoded[0]) {
      case ICMP_TYPE_RPL:
        this.handleRplMessage(packetInd, decoded);
        break;
      case ICMP_TYPE_UNREACHABLE:
        this.handleUnreachableMessage(packetInd, decoded);
        break;
      default:
        console.log('unknown icmp-message-type: ' + decoded[0]);
    }
  }

  private handleUdpIndication(udpPacket: IpPacket) {
    if (udpPacket.v6Header.destAddress === this.tableService.interfaceId
      || udpPacket.v6Header.destAddress === ALL_RPL_ROUTER) {
      this.udpIndications.next(udpPacket);
    } else if (udpPacket.v6Header.hopLimit > 0) {
      udpPacket.v6Header.hopLimit--;
      this.ipService.trySendPacket(udpPacket, this.onParentSendConfirmation.bind(this));
    } else {
      console.log('dropped unhandled udp-packet ' + udpPacket.v6Header.sourceAddress + '/' + udpPacket.v6Header.destAddress);
    }
  }

  onParentSendConfirmation(respondedPacket: IpPacket) {
    if (respondedPacket.response.includes('UNREACHABLE')) {
      this.handleUnreachableEvent(respondedPacket.v6Header);
    } else if (!respondedPacket.response.includes('SUCCESS')) {
      console.log('Error on sending ip-packet: ' + respondedPacket.response);
    }
  }

  private handleRplMessage(packetInd: IpPacket, decoded: Uint8Array) {
    switch (decoded[1]) {
      case RPL_CODE_DIO:
        this.handleDioIndication(packetInd, decoded);
        break;
      case RPL_CODE_DRO:
        this.handleP2PDroIndication(packetInd, decoded);
        break;
      default:
        console.log('unknown rpl-message-code: ' + decoded[1]);
        break;
    }
  }

  private handleDioIndication(packetInd: IpPacket, decoded: Uint8Array) {
    switch (this.rplGenerator.getModeOfOperationFromDio(decoded)) {
      case 4: this.handleP2PDio(packetInd, decoded);
      break;
      default:
        console.log('unsupported mode of operation: ' + this.rplGenerator.getModeOfOperationFromDio(decoded));
    break;
    }
  }

  private handleP2PDio(packetInd: IpPacket, decoded: Uint8Array) {

    if (this.rplGenerator.hasP2PDioDiscoveryOption(decoded)) {
      const entry = new RoutingTableEntry();
      const compression = this.rplGenerator.getCompressionFromDiscoveryOptionInDio(decoded);
      if (compression !== 14) {
        console.log('unsupported compression mode in p2p dio');
        return;
      }
      const target = this.rplGenerator.getTargetFromDiscoveryOptionInDio(decoded);
      const root = this.rplGenerator.getRootFromDiscoveryDio(decoded);
      const addressList = this.rplGenerator.getAddressListFromDiscoveryOptionInDio(decoded);

      if (addressList.includes(this.tableService.interfaceId)) {
        return;
      }

      entry.rootAddress = root;
      entry.childAddress = target;
      entry.routeKey = entry.rootAddress + '/' + entry.childAddress;
      entry.rankHigh = addressList.length + 1;
      entry.rplId = this.rplGenerator.getRplIdFromDio(decoded);
      entry.linkHeaderToRoot = packetInd.linkHeader;
      entry.linkHeaderToRoot = LinkHeader
        .create(this.tableService.macId, packetInd.linkHeader.linkSource);

      if (this.tableService.joinAsChild(entry)) {
        const packet = new IpPacket();
        packet.v6Header = new IpHeader();
        packet.v6Header.sourceAddress = entry.childAddress;
        packet.v6Header.destAddress = entry.rootAddress;
        packet.v6Header.hopLimit = entry.rankHigh;
        packet.payload = this.rplGenerator.childDiscoveryDro(packet.v6Header, entry.rplId, addressList);
        this.ipService.trySendPacket(packet, this.onSentChildDiscoveryDro.bind(this));
      } else if ( packetInd.v6Header.hopLimit > 0 && this.tableService.discoverAsParent(entry)) {
        const packet = new IpPacket();
        packet.v6Header = new IpHeader();
        packet.v6Header.sourceAddress = packetInd.v6Header.sourceAddress;
        packet.v6Header.destAddress = ALL_RPL_ROUTER;
        packet.v6Header.hopLimit = packetInd.v6Header.hopLimit - 1;
        packet.payload = this.rplGenerator.parentPathDiscoveryDio(decoded, this.tableService.interfaceId);
        this.ipService.trySendPacket(packet, this.onSentParentDiscoveryDio.bind(this));
      }
    }
  }

  private handleP2PDroIndication(packetInd: IpPacket, decoded: Uint8Array) {
    if (this.rplGenerator.hasDroDiscoveryOption(decoded)) {
      const entry = new RoutingTableEntry();
      const compression = this.rplGenerator.getCompressionFromDiscoveryOptionInDro(decoded);
      if (compression !== 14) {
        return;
      }
      const nextHop = this.rplGenerator.getNextHopFromDiscoveryOptionInDro(decoded);
      const target = this.rplGenerator.getTargetFromDiscoveryOptionInDro(decoded);
      const root = this.rplGenerator.getRootFromDiscoveryOptionInDro(decoded);
      const nextDest = this.rplGenerator.getNextParentOrRootFromDiscoveryOtionInDro(decoded, nextHop - 1);
      const addressList = this.rplGenerator.getAddressListFromDiscoveryOptionInDro(decoded);

      entry.rootAddress = root;
      entry.childAddress = target;
      entry.routeKey = entry.rootAddress + '/' + entry.childAddress;
      entry.rplId = this.rplGenerator.getRplIdFromDro(decoded);
      entry.linkHeaderToChild = LinkHeader.create(this.tableService.macId, packetInd.linkHeader.linkSource);
      entry.rankHigh = nextHop;
      entry.routeLength = addressList.length;
      if (this.tableService.joinAsRoot(entry)) {
        this.onJoinAsRoot(target);
      } else if (this.tableService.interfaceId === addressList[nextHop - 1]
        && this.tableService.joinAsParent(entry)) {
        const packet = new IpPacket();
        packet.v6Header = new IpHeader();
        packet.v6Header.sourceAddress = packetInd.v6Header.sourceAddress;
        packet.v6Header.destAddress = packetInd.v6Header.destAddress;
        packet.v6Header.hopLimit = packetInd.v6Header.hopLimit - 1;
        packet.payload = this.rplGenerator.parentPathDiscoveryDro(decoded);
        this.ipService.trySendPacket(packet, this.onSentParentDiscoveryDro.bind(this));
      }
    }
  }

  private onJoinAsRoot(target: string) {
    if (this.callbackMap.has(target)) {
      this.callbackMap.get(target).forEach(
        value => {
          value(target, true);
        });
      this.callbackMap.delete(target);
    }
  }


   onSentRootDiscoveryDio(packet: IpPacket): void {
    console.log('sent root discovery dio: ' + packet.response);
  }
  onSentParentDiscoveryDio(packet: IpPacket): void {
    console.log('sent parent discovery dio: ' + packet.response);
  }
  onSentChildDiscoveryDro(packet: IpPacket): void {
    console.log('sent child discovery dro: ' + packet.response);
  }
  onSentParentDiscoveryDro(packet: IpPacket): void {
    console.log('sent parent discovery dro: ' + packet.response);
  }

  private handleUnreachableEvent(header: IpHeader): void {
    const noPathPacket = new IpPacket();
    noPathPacket.v6Header = new IpHeader();
    noPathPacket.v6Header.sourceAddress = header.destAddress;
    noPathPacket.v6Header.destAddress = header.sourceAddress;
    noPathPacket.payload = this.rplGenerator.icmpUnreachable();
    this.ipService.trySendPacket(noPathPacket, (
      (packet: IpPacket) => this.tableService.deleteRoute(
        packet.v6Header.destAddress,
        packet.v6Header.sourceAddress)));
  }

  private handleUnreachableMessage(packetInd: IpPacket, decoded: Uint8Array) {
    const noPathPacket = new IpPacket();
    noPathPacket.v6Header = new IpHeader();
    noPathPacket.v6Header.destAddress = packetInd.v6Header.destAddress;
    noPathPacket.v6Header.sourceAddress = packetInd.v6Header.sourceAddress;
    noPathPacket.payload = this.rplGenerator.icmpUnreachable();
    this.ipService.trySendPacket(noPathPacket, (
      (packet: IpPacket) => this.tableService.deleteRoute(
        packet.v6Header.destAddress,
        packet.v6Header.sourceAddress)));
  }
}
