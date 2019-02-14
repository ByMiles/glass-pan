import {LinkHeader} from '../ip-packet/IpPacket';

export class RoutingTableEntry {

  routeKey: string; // example: 'fe80::ff:fe00:R/fe80::ff:fe00:C (R = root, C = child)
  rootAddress: string;
  childAddress: string;
  linkHeaderToRoot: LinkHeader;
  linkHeaderToChild: LinkHeader;
  rankHigh: number;
  rankLow: number;
  rplId: number;
  routeLength: number;
}
