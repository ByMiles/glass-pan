export class MacId {

  channel: number;
  panId: number;
  address: number;
}

export const macIdAsUrl: (macId: MacId) => string =
  (macId => macId.channel + '/' + macId.panId + '/' + macId.address );
