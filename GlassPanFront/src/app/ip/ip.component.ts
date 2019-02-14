import { Component, OnInit } from '@angular/core';
import {ALL_COAP_DEVICES, ALL_RPL_ROUTER, IpService, UNICAST_PREFIX} from './ip.service';
import {MacId} from '../mac/MacId';
import {ActivatedRoute} from '@angular/router';
import {RoutingTableService} from '../routing-table/routing-table.service';

@Component({
  selector: 'app-ip',
  templateUrl: './ip.component.html',
  styleUrls: ['./ip.component.scss']
})
export class IpComponent implements OnInit {
  localInterface: string;
  multicastCoAp = ALL_COAP_DEVICES;
  multicastRpl = ALL_RPL_ROUTER;
  macId: MacId;
  isDemo: boolean;
  mode: string;
  constructor(private route: ActivatedRoute,
  private tableService: RoutingTableService,
              private ipService: IpService) { }

  ngOnInit() {
    this.macId = new MacId();
    this.macId.channel =  +this.route.snapshot.paramMap.get('channel');
    this.macId.panId =  +this.route.snapshot.paramMap.get('panId');
    this.macId.address =  +this.route.snapshot.paramMap.get('address');
    this.mode = this.route.snapshot.paramMap.get('mode');
    this.isDemo = (this.mode === 'demo');
    this.localInterface = UNICAST_PREFIX + this.macId.address.toString(16);
    this.tableService.interfaceId = this.localInterface;
    this.tableService.macId = this.macId;
    this.ipService.start(this.macId, this.isDemo);
  }

}
