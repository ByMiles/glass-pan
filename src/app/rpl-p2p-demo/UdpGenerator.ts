import {IpPacket, PacketElement} from '../ip-packet/IpPacket';
import {NEXT_HEADER_UDP} from './RplP2PGenerator';
import {B64Util} from '../util/B64Util';

export class UdpGenerator {

  static udpDatagram(sourcePort: number, destPort: number, dataString: string): PacketElement {
    const data = B64Util.b64ToBuffer(dataString);
    const datagram = new Uint8Array(data.length + 8);
    datagram[0] = sourcePort >> 8;
    datagram[1] = sourcePort & 0xff;
    datagram[2] = destPort >> 8;
    datagram[3] = destPort & 0xff;
    datagram[4] = data.length >> 8;
    datagram[5] = data.length & 0xff;
    // checksum
    // checksum
    datagram.set(data, 8);
    const element = new PacketElement();
    element.protocol = NEXT_HEADER_UDP;
    element.payload = B64Util.bufferToB64(datagram);
    return element;
  }

  static udpMessage(payload: PacketElement): string {
    return B64Util.bufferToB64(B64Util.b64ToBuffer(payload.payload).slice(8));
  }
}
