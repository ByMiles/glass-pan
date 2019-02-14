import {Component, Input, OnInit} from '@angular/core';
import {IpPacket} from './IpPacket';
import {ALL_COAP_DEVICES, ALL_RPL_ROUTER, UNICAST_PREFIX} from '../ip/ip.service';

@Component({
  selector: 'app-ip-packet',
  templateUrl: './ip-packet.component.html',
  styleUrls: ['./ip-packet.component.scss']
})
export class IpPacketComponent implements OnInit {

  @Input() packet: IpPacket;
  @Input() isNew: boolean;
  isUnicast: boolean;
  isAllRplRouter: boolean;
  destAddress: number;
  private payloadLength: number;

  constructor() {
    this.isAllRplRouter = true;
  }

  @Input()
  set unicast(unicast: boolean) {
    if (this.isNew) {
      this.isUnicast = unicast;
      if (this.isUnicast) {
        this.updateUnicastAddress();
      } else {
        this.isAllRplRouter = !this.isAllRplRouter;
        this.updateMulticastAddress();
      }
    }
  }

  ngOnInit() {
    if (this.isNew) {
      this.packet.v6Header.hopLimit = 7;
      this.destAddress = 1;
      this.updateUnicastAddress();
    }
    this.countPayload();
  }

  updateUnicastAddress() {
    console.log('input :' + this.destAddress);
    if (this.destAddress > 0 && this.destAddress < 65535) {
      const identifier = (this.destAddress).toString(16);
      this.packet.v6Header.destAddress = UNICAST_PREFIX + identifier;
    }
  }

  updateMulticastAddress() {
    this.isAllRplRouter = !this.isAllRplRouter;
    this.packet.v6Header.destAddress = (this.isAllRplRouter)
      ? ALL_RPL_ROUTER
      : ALL_COAP_DEVICES;
  }

  countPayload() {
    this.payloadLength = this.packet.payload.payload.length;
  }

  checkHopLimit() {
    if (this.packet.v6Header.hopLimit === undefined
    || this.packet.v6Header.hopLimit < 1
    || this.packet.v6Header.hopLimit > 99) {
      this.packet.v6Header.hopLimit = 7;
    }
  }
  checkProtocol() {
    if (this.packet.payload.protocol === undefined
      || this.packet.payload.protocol < 1
      || this.packet.payload.protocol > 99) {
      this.packet.payload.protocol = 58;
    }
  }
}
