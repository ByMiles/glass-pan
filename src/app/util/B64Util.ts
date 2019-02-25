export class B64Util {

  static unicodeToB64(str: string): string {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      // function toSolidBytes(match, p1) {
      (match, p1) => {
        // console.debug('match: ' + match);
        return String.fromCharCode(('0x' + p1) as any);
      }));
  }

  static b64ToUnicode(str: string): string {
    // Going backwards: from byte-stream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map( (c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  static b64ToBuffer(base64: string): Uint8Array {
    const binStr = atob(base64);
    const buf = new Uint8Array(binStr.length);
    Array.prototype.forEach.call(binStr,  (ch, i) => {
      buf[i] = ch.charCodeAt(0);
    });
    return buf;
  }

  static bufferToB64(buf: Uint8Array): string {
    const binStr = Array.prototype.map.call(buf, function (ch) {
      return String.fromCharCode(ch);
    }).join('');
    return btoa(binStr);
  }
}
