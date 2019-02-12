import {IpHeader, PacketElement} from '../ip-packet/IpPacket';
import {B64Util} from '../util/B64Util';
import {UNICAST_PREFIX} from '../ip/ip.service';

export const NEXT_HEADER_ICMP = 58;
export const NEXT_HEADER_UDP = 17;
export const ICMP_TYPE_RPL = 155;
export const ICMP_TYPE_UNREACHABLE = 1;
export const RPL_CODE_DIO = 1;
export const RPL_CODE_DRO = 4;
export const RPL_OPTION_TYPE_P2P_RDO = 0x0a;

function cutShortAddressFromUnicast(address: string): number {
  const segments = address.split(':');
  return parseInt(segments[segments.length - 1], 16);
}

function cutShortAddressDecoded(decoded: Uint8Array, position): number {
  console.log('cut short: ' + decoded.length + ' / ' + position + ' => ' + ((decoded[position] << 8) + decoded[position + 1]));
  return (decoded[position] << 8) + decoded[position + 1];
}

function generateUnicastFromShortAddress(shortAddress: number): string {
  return UNICAST_PREFIX + shortAddress.toString(16);
}

function addDodagId(address: string, buffer: Uint8Array, index: number): void {

  const significant = cutShortAddressFromUnicast(address);

    buffer[index++] = 0xff;
    buffer[index++] = 0xfe;
    buffer[index++] = 0x0;
    buffer[index++] = 0x0;

    buffer[index++] = 0x0;
    buffer[index++] = 0x0;
    buffer[index++] = 0x0;
    buffer[index++] = 0x0;

    buffer[index++] = 0x0;
    buffer[index++] = 0x0;
    buffer[index++] = 0x0;
    buffer[index++] = 0xff;

    buffer[index++] = 0xfe;
    buffer[index++] = 0x00;
    buffer[index++] = significant >> 8;
    buffer[index] = significant & 0xff;
}

function createFreshOption(targetAddress: string): Uint8Array {
  const option = new Uint8Array(6);
  const shortAddress = cutShortAddressFromUnicast(targetAddress);
  console.log('target 1: ' + targetAddress + ' | ' + shortAddress);
  option[0] = RPL_OPTION_TYPE_P2P_RDO; // 28
  option[1] = 4; // length without type and length
  option[2] = 0b1100_1110; // |reply|hopByHop|routes(2)|compr(4)|
  option[3] = 0b1100_0000; // |lifeTime(2)|maxRank(6)
  option[4] = shortAddress >> 8;
  option[5] = shortAddress & 0xff; // 33

  return option;
}

function createP2PDroRdoOption(targetAddress: string, addressList: string[], nextHop: number) {
  const option = new Uint8Array(6 + addressList.length * 2);
  const shortAddress = cutShortAddressFromUnicast(targetAddress);
  console.log('next hop set: ' + nextHop);
  option[0] = RPL_OPTION_TYPE_P2P_RDO; // 24
  option[1] = 4 + addressList.length * 2; // length without type and length
  option[2] = 0b1100_1110; // |reply|hopByHop|routes(2)|compr(4)|
  option[3] = 0b1100_0000 + nextHop; // |lifeTime(2)|nextHop(6)
  option[4] = shortAddress >> 8;
  option[5] = shortAddress & 0xff; // 29

  let optionPointer = 6;
  for (const address of addressList) {
    const aShortAddress = cutShortAddressFromUnicast(address);
    console.log('child dro addresss ' + aShortAddress + ' <= ' + address);
    option[optionPointer++] = aShortAddress >> 8;
    option[optionPointer++] = aShortAddress & 0xff;
  }

  return option;
}

export class RplP2PGenerator {

  startPathDiscoveryDio(rootAddress: string, childAddress,
                          rplId: number): PacketElement {

    const buffer = new Uint8Array(28);
    buffer[ 0] = ICMP_TYPE_RPL;
    buffer[ 1] = RPL_CODE_DIO;
    // 2 checksum
    // 3 checksum
    buffer[ 4] = rplId >> 8;   // rplInstanceId
    buffer[ 5] = rplId & 0xff; // version
    buffer[ 6] = 0; // rank high
    buffer[ 7] = 0; // rank low
    buffer[ 8] = 0b1010_0000; // |grounded(1)|0|Mode of operation = p2p (100)| preference = least(000)|
    buffer[ 9] = 0; // sequence number
    buffer[10] = 0; // flags
    buffer[11] = 0; // reserved
    // dodagId
    addDodagId(rootAddress, buffer, 12); // + 16 => 27

    const option = createFreshOption(childAddress);

    const message = new Uint8Array(option.length + buffer.length);
    message.set(buffer);
    message.set(option, buffer.length);
    const element = new PacketElement();
    element.protocol = NEXT_HEADER_ICMP;
    element.payload = B64Util.bufferToB64(message);
    return element;
  }

  getModeOfOperationFromDio(decoded: Uint8Array): number {
    return (decoded[8] >> 3) & 0b111;
  }

  getRplIdFromDio(decoded: Uint8Array) {
    return (decoded[4] << 8) + decoded[5];
  }

  hasP2PDioDiscoveryOption(decoded: Uint8Array) {
    return decoded.length > 28 && decoded[28] === RPL_OPTION_TYPE_P2P_RDO;
  }

  getTargetFromDiscoveryOptionInDio(decoded: Uint8Array) {

    console.log('target 2: ' + (UNICAST_PREFIX + ((decoded[32] << 8) + decoded[33]).toString(16))
      + ' | ' + ((decoded[32] << 8) + decoded[33]));
    return UNICAST_PREFIX + ((decoded[32] << 8) + decoded[33]).toString(16);
  }

  getCompressionFromDiscoveryOptionInDio(decoded: Uint8Array) {
    return decoded[30] & 0b1111;
  }

  getAddressListFromDiscoveryOptionInDio(decoded: Uint8Array): string[] {
    console.log('addressList: ...');
    const addressCount = (decoded[29] - 4) / 2;
    console.log(decoded[29] + ' => ' + addressCount);
    if (addressCount === 0) {
      return [];
    } else {
      const listStart = 34;
      const listEnd = listStart + addressCount * 2;
      const list = [];
      for (let listPosition = listStart; listPosition < listEnd; listPosition += 2) {
        list.push(generateUnicastFromShortAddress(cutShortAddressDecoded(decoded, listPosition)));
      console.log(' => ' + (list[list.length - 1]));
      }
      console.log(' ... ' + list.length);
      return list;
    }
  }

  childDiscoveryDro(header: IpHeader, rplId: number, addressList: string[]): PacketElement {
    const buffer = new Uint8Array(24);
    buffer[0] = ICMP_TYPE_RPL;
    buffer[1] = RPL_CODE_DRO;
    // 2 checksum
    // 3 checksum
    buffer[4] = rplId >> 8;   // rplInstanceId
    buffer[5] = rplId & 0xff; // version
    buffer[6] = 0; // |stop(1)|acknowledge(1)|sequence(2)|reserved(2)| }
    buffer[7] = 0; // reserved
    addDodagId(header.destAddress, buffer, 8); // => 24
    const option = createP2PDroRdoOption(header.sourceAddress, addressList, addressList.length);
    const message = new Uint8Array(buffer.length + option.length);
    message.set(buffer);
    message.set(option, buffer.length);
    const element = new PacketElement();
    element.protocol = NEXT_HEADER_ICMP;
    element.payload = B64Util.bufferToB64(message);
    return element;
  }

  parentPathDiscoveryDio(decoded: Uint8Array, interfaceId: string): PacketElement {
    const buffer = new Uint8Array(decoded.length + 2);
    buffer.set(decoded);
    buffer[29] += 2;
    const shortAddress = cutShortAddressFromUnicast(interfaceId);
    buffer[buffer.length - 2] = shortAddress >> 8;
    buffer[buffer.length - 1] = shortAddress & 0xff;

    const element = new PacketElement();
    element.protocol = NEXT_HEADER_ICMP;
    element.payload = B64Util.bufferToB64(buffer);
    return element;
  }

  hasDroDiscoveryOption(decoded: Uint8Array) {
    return decoded.length > 24 && decoded[24] === RPL_OPTION_TYPE_P2P_RDO;
  }

  getCompressionFromDiscoveryOptionInDro(decoded: Uint8Array) {
    return decoded[26] & 0b1111;
  }

  getTargetFromDiscoveryOptionInDro(decoded: Uint8Array) {
    return UNICAST_PREFIX + ((decoded[28] << 8) + decoded[29]).toString(16);
  }

  getAddressListFromDiscoveryOptionInDro(decoded: Uint8Array) {

    const addressCount = (decoded[25] - 4) / 2;
    if (addressCount === 0) {
      return [];
    } else {
      const listStart = 30;
      const listEnd = listStart + addressCount * 2;
      const list = [];
      for (let listPosition = listStart; listPosition < listEnd; listPosition += 2) {
        list.push(generateUnicastFromShortAddress(cutShortAddressDecoded(decoded, listPosition)));
      console.log(' from dro: ' + list[list.length - 1]);
      }
      return list;
    }
  }

  getRplIdFromDro(decoded: Uint8Array) {
    return (decoded[4] << 8) + decoded[5];
  }

  getNextHopFromDiscoveryOptionInDro(decoded: Uint8Array) {
    console.log('next hop get: ' + (decoded[27] & 0b0011_1111));
    return decoded[27] & 0b0011_1111;
  }

  parentPathDiscoveryDro(decoded: Uint8Array): PacketElement {
    const buffer = new Uint8Array(decoded);
    buffer[27] -= 1;
    const element = new PacketElement();
    element.protocol = NEXT_HEADER_ICMP;
    element.payload = B64Util.bufferToB64(buffer);
    return element;
  }

  icmpUnreachable(): PacketElement {
    const buffer = new Uint8Array(8);
    buffer[0] = ICMP_TYPE_UNREACHABLE;
    buffer[1] = 0; // destination unreachable;
    // checksum
    // checksum
    // unused...
    const element = new PacketElement();
    element.protocol = NEXT_HEADER_ICMP;
    element.payload = B64Util.bufferToB64(buffer);
    return element;
  }

  getRootFromDiscoveryDio(decoded: Uint8Array) {
    return generateUnicastFromShortAddress(cutShortAddressDecoded(decoded, 26));
  }

  getRootFromDiscoveryOptionInDro(decoded: Uint8Array) {
    return generateUnicastFromShortAddress(cutShortAddressDecoded(decoded, 22));
  }

  getNextParentOrRootFromDiscoveryOtionInDro(decoded: Uint8Array, rank: number) {
    if (rank === 0) {
      return generateUnicastFromShortAddress(cutShortAddressDecoded(decoded, 22));
    } else {
      return generateUnicastFromShortAddress(cutShortAddressDecoded(decoded, 30 + (rank - 1) * 2));
    }
  }
}

