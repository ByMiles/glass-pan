export class ServiceDesc {
  domain: string;
  httpPort: number;
  wsPort: number;
}

export const HttpUrl = (desc: ServiceDesc) => 'http://' + desc.domain + ':' + desc.httpPort + '/';
export const WsUrl = (desc: ServiceDesc) => 'ws://' + desc.domain + ':' + desc.wsPort + '/';
