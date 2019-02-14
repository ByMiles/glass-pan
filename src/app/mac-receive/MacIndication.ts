import {MacFrame} from '../mac-send/MacFrame';

export class MacIndication extends MacFrame {
  sourcePanId: number;
  sourceAddress: number;
  quality: number;
}
