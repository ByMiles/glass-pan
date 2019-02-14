import {Observable, Observer, Subject} from 'rxjs';
export const createSubject: (ws: WebSocket) => Subject<MessageEvent> = ws => {

  return Subject.create(({
    next: (data: string | ArrayBufferLike) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        } else {
          console.log('not sent');
        }
      }
    }),
    Observable.create(
    (obs: Observer<MessageEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    }));
};

export const createWebSocket: (url: string) => WebSocket = (url) => {
  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    console.log('ERROR on Connection: ' + e.toString());
    this.isValidEmitter.emit(false);
  }
  return ws;
};

