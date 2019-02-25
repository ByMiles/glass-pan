import {Component, Input, OnInit} from '@angular/core';
import {IpHeader, IpPacket, LinkHeader, PacketElement} from '../ip-packet/IpPacket';
import {LpanTagService} from '../lpan-tag/lpan-tag.service';
import {MacId, macIdAsUrl} from '../mac/MacId';
import {UNICAST_PREFIX} from '../ip/ip.service';
import {MacFrame} from '../mac-send/MacFrame';
import {LpanSendService} from './lpan-send.service';
import {MacSendService} from '../mac-send/mac-send.service';
import {Base64} from 'js-base64';
import {B64Util} from '../util/B64Util';
import {DemoService} from '../demo/demo.service';

@Component({
  selector: 'app-lpan-send',
  templateUrl: './lpan-send.component.html',
  styleUrls: ['./lpan-send.component.scss']
})
export class LpanSendComponent implements OnInit {

  @Input() macId: MacId;
  @Input() isDemo: boolean;
  macUrl: string;
  newPacket: IpPacket;
  linkHeader: LinkHeader;
  lastPacket: IpPacket;
  nextFrames: MacFrame[];
  lastFrames: MacFrame[];
  sendResponse: string;
  framesReady: boolean;
  isUnicast: boolean;
  private storedLinkDest: number;
  private storedLpanDest: string;
  transformResponse: string;

  constructor(private tagger: LpanTagService,
              private lpanService: LpanSendService,
              private macService: MacSendService,
              private demoService: DemoService) {
    this.isUnicast = true;
  }

  ngOnInit() {
    this.macUrl = macIdAsUrl(this.macId);
    this.initLinkHeader();
    this.initNewPacket();
  }

  private initNewPacket() {
    this.newPacket = new IpPacket();
    this.newPacket.packetTag = this.tagger.nextTag();

    this.newPacket.linkHeader = this.linkHeader;

    this.newPacket.v6Header = new IpHeader();
    this.newPacket.v6Header.sourceAddress = UNICAST_PREFIX + this.macId.address.toString(16);
    this.newPacket.v6Header.destAddress = this.storedLpanDest;
    this.newPacket.payload = new PacketElement();
    this.newPacket.payload.payload = 'Hello network';
    this.newPacket.payload.protocol = 58;
    this.newPacket.v6Header.hopLimit = 7;
  }

  private initLinkHeader() {
    this.linkHeader = new LinkHeader();
    this.linkHeader.linkSource = this.macId.address;
    this.linkHeader.panId = this.macId.panId;
    this.linkHeader.channel = this.macId.channel;
  }

  updateAddress() {
    this.isUnicast = !this.isUnicast;
    if (this.isUnicast) {
      this.linkHeader.linkDestination = this.storedLinkDest;
    } else {
      this.storedLinkDest = this.linkHeader.linkDestination;
      this.linkHeader.linkDestination = 65355;
    }
  }

  tryTransformToFrames() {
    if (!(this.newPacket.payload.payload.length < 8)) {
      this.newPacket.payload.payload = B64Util.unicodeToB64(this.newPacket.payload.payload);
      this.lpanService.tryTransformToFrames(this.newPacket, this.onTransformConfirmation.bind(this));
    }
  }

  onTransformConfirmation(
    composed: IpPacket,
    frames: MacFrame[],
    response: string): void {
    this.lastPacket = composed;
    this.storedLpanDest = composed.v6Header.destAddress;
    this.initNewPacket();
    this.transformResponse = response;
    if (frames != null && frames.length > 0) {
      this.nextFrames = frames;
      this.framesReady = true;
    } else {
      this.nextFrames = null;
      this.framesReady = false;
    }
  }


  trySendFrames() {
    if (this.framesReady) {
      this.macService.trySendMacFrames(this.macUrl, this.nextFrames, this.onSendConfirmation.bind(this));
    } else {
      this.sendResponse = 'no frames to send...';
    }
  }

  onSendConfirmation(response: string, frames: MacFrame[]): void {
    this.sendResponse = response;
    this.lastFrames = frames;
  }

  tryTransformAndSend() {
    if (!(this.newPacket.payload.payload.length < 8)) {
      this.newPacket.payload.payload = B64Util.unicodeToB64(this.newPacket.payload.payload);
      if (this.isDemo) {
        this.demoService.trySendPacket(
          this.newPacket,
          this.onTransformAndSendConfirmation.bind(this));
      } else {
        this.lpanService.trySendAsFrames(
          this.macUrl,
          this.newPacket,
          this.onTransformAndSendConfirmation.bind(this));
      }
      this.newPacket.payload.payload = B64Util.b64ToUnicode(this.newPacket.payload.payload);
    }
  }

  onTransformAndSendConfirmation(composed: IpPacket): void {
    this.sendResponse = composed.response;
    this.lastPacket = composed;
    this.lastPacket.payload.payload = B64Util.b64ToUnicode(this.lastPacket.payload.payload);
  }
}
