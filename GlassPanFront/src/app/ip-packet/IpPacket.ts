import {MacId} from '../mac/MacId';

export class IpPacket {
  v6Header: IpHeader;
  linkHeader: LinkHeader;
  extensionHeaders: PacketElement[];
  payload: PacketElement;
  packetTag: number;
  response: string;
}

export class IpHeader {
  sourceAddress: string;
  destAddress: string;
  hopLimit: number;
}

export class PacketElement {
  protocol: number;
  payload: string;
}

export class LinkHeader {
  channel: number;
  panId: number;
  linkSource: number;
  linkDestination: number;

  static create(macId: MacId, linkDest: number): LinkHeader {
    const header = new LinkHeader();
    header.channel = macId.channel;
    header.panId = macId.panId;
    header.linkSource = macId.address;
    header.linkDestination = linkDest;
    return header;
  }
}

 export const linkHeaderAsLinkUrl = (aHeader: LinkHeader) =>
   aHeader.channel + '/' + aHeader.panId + '/' + aHeader.linkSource + '/' + aHeader.linkDestination;

