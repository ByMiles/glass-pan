import {MacFrame} from '../mac-send/MacFrame';
import {LinkHeader} from '../ip-packet/IpPacket';

export class IpFragments {
  linkHeader: LinkHeader;
  packetSize: number;
  packetTag: number;
  fragments: string[];
  response: string;
}

export const packetFragmentsToMacFrames =
(packet: IpFragments): MacFrame[] => {
  const nextFrames = [];
  if (packet.fragments != null) {
    packet.fragments.forEach((value) => {
      const aFrame = new MacFrame();
      aFrame.destPanId = packet.linkHeader.panId;
      aFrame.destAddress = packet.linkHeader.linkDestination;
      aFrame.data = value;
      nextFrames.push(aFrame);
    });
  }
  return nextFrames;
};

