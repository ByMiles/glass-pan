import { Component, OnInit } from '@angular/core';
import {LinkHeader, linkHeaderAsLinkUrl} from '../ip-packet/IpPacket';
import {DemoService} from './demo.service';
import {nextContext} from '@angular/core/src/render3';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit {
  header: LinkHeader;
  connections: Map<string, number>;

  constructor(private demoService: DemoService) {
    this.header = new LinkHeader();
    this.header.channel = 11;
    this.header.panId = 1;
    this.header.linkSource = 1;
    this.header.linkDestination = 2;
  }

  ngOnInit() {
    this.demoService.setMaster();
    this.demoService.demoLinks.subscribe(
      next => this.connections = next);
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 2;
    this.header.linkDestination = 1;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 2;
    this.header.linkDestination = 3;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 3;
    this.header.linkDestination = 2;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 3;
    this.header.linkDestination = 4;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 4;
    this.header.linkDestination = 3;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 4;
    this.header.linkDestination = 5;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
    this.header.linkSource = 5;
    this.header.linkDestination = 4;
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
  }

  addConnection() {
    this.demoService.setLocalLink(linkHeaderAsLinkUrl(this.header));
  }

  removeConnection(link: string) {
    this.demoService.removeLocalLink(link);
  }
}
