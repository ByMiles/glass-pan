import {Injectable} from '@angular/core';

import {RoutingTableEntry} from './RoutingTableEntry';
import {BehaviorSubject} from 'rxjs';
import {MacId} from '../mac/MacId';
import {LinkHeader} from '../ip-packet/IpPacket';

@Injectable({
  providedIn: 'root'
})
export class RoutingTableService {

  private rootRoutes = new Map<string, RoutingTableEntry>();
  rootTable: BehaviorSubject<RoutingTableEntry[]>;
  private parentRoutes = new Map<string, RoutingTableEntry>();
  parentTable: BehaviorSubject<RoutingTableEntry[]>;
  private childRoutes = new Map<string, RoutingTableEntry>();
  childTable: BehaviorSubject<RoutingTableEntry[]>;
  private openRoutes = new Map<string, RoutingTableEntry>();
  discoveryTable: BehaviorSubject<RoutingTableEntry[]>;

  private neighboursQualityMap = new Map<number, number[]>();
  neighbours: BehaviorSubject<Map<number, number[]>>;
  interfaceId: string;
  macId: MacId;
  rplId: number;
  multicastLinkHeader: LinkHeader;

  constructor() {
    this.rootTable = new BehaviorSubject<RoutingTableEntry[]>([]);
    this.childTable = new BehaviorSubject<RoutingTableEntry[]>([]);
    this.parentTable = new BehaviorSubject<RoutingTableEntry[]>([]);
    this.discoveryTable = new BehaviorSubject<RoutingTableEntry[]>([]);
    this.neighbours = new BehaviorSubject<Map<number, number[]>>(this.neighboursQualityMap);
    this.rplId = Math.floor(Math.random() * 65356 + 1);
  }

  logNeighbourQuality(address: number, quality: number) {
    console.log('XXX!!! new quality: ' + address + ' => ' + quality);
    if (!this.neighboursQualityMap.has(address)) {
      this.neighboursQualityMap.set(address, []);
    }
    this.neighboursQualityMap.get(address).push(quality);
    console.log('XXX!!! ' + this.neighboursQualityMap.get(address).toLocaleString());
    this.neighbours.next(this.neighboursQualityMap);
  }

  getLastNeighbourQuality(address: number): number {
    if (!this.neighboursQualityMap.has(address)) {
      return 0;
    } else {
      const qualities = this.neighboursQualityMap.get(address);
      return qualities[qualities.length - 1];
    }
  }

  hasRoute(address: string) {
    const routeAsRoot = this.interfaceId + '/' + address;
    const routeAsChild = address + '/' + this.interfaceId;
    return this.rootRoutes.has(routeAsRoot) || this.childRoutes.has(routeAsChild);
  }

  discoverAsRoot(entry: RoutingTableEntry): boolean {
    this.openRoutes.set(entry.routeKey, entry);
    this.discoveryTable.next(Array.from(this.openRoutes.values()));
    return true;
  }

  discoverAsParent(entry: RoutingTableEntry): boolean {
    if (entry.childAddress === this.interfaceId) {
      return false;
    }

    if (!this.openRoutes.has(entry.routeKey)
      || this.newIsBetter(entry, this.openRoutes.get(entry.routeKey))) {
      this.openRoutes.set(entry.routeKey, entry);
      this.discoveryTable.next(Array.from(this.openRoutes.values()));
      return true;
    } else {
      return false;
    }
  }

  private newIsBetter(newEntry: RoutingTableEntry, oldEntry: RoutingTableEntry): boolean {
    return (newEntry.rplId === oldEntry.rplId)
      && (newEntry.rankHigh > oldEntry.rankHigh);
  }

  joinAsChild(entry: RoutingTableEntry) {
    console.log('DISCOVERY join as child');
    if (entry.childAddress !== this.interfaceId) {
      console.log('DISCOVERY join as child is not interfaceId: ' + entry.childAddress + ' | ' + this.interfaceId);
      return false;
    }

    if (!this.childRoutes.has(entry.routeKey)
      || this.newIsBetter(entry, this.childRoutes.get(entry.routeKey))) {

      console.log('DISCOVERY join as child success');
      entry.routeLength = entry.rankHigh - 1;
      this.childRoutes.set(entry.routeKey, entry);
      this.childTable.next(Array.from(this.childRoutes.values()));
      return true;
    }
    return false;
  }

  joinAsRoot(entry: RoutingTableEntry): boolean {
    console.log('join as root? : ' + entry.rootAddress + ' | ' +
      this.interfaceId + ' >> ' + entry.rankHigh + ' ' + entry.rplId);
    if (entry.rootAddress !== this.interfaceId
      || entry.rankHigh !== 0
      || entry.rplId !== this.rplId) {
      return false;
    }
    if (this.openRoutes.has(entry.routeKey)) {
      this.rootRoutes.set(entry.routeKey, entry);
      this.openRoutes.delete(entry.routeKey);
      this.discoveryTable.next(Array.from(this.openRoutes.values()));
      this.rootTable.next(Array.from(this.rootRoutes.values()));
      return true;
    } else if (this.rootRoutes.has(entry.routeKey)
      && this.rootRoutes.get(entry.routeKey).routeLength > entry.routeLength) {
      this.rootRoutes.set(entry.routeKey, entry);
      this.rootTable.next(Array.from(this.rootRoutes.values()));
      return true;
    }
    return false;
  }

  joinAsParent(entry: RoutingTableEntry): boolean {

    if (entry.rootAddress === this.interfaceId
      || entry.rankHigh === 0) {
      return false;
    }
    let storedEntry: RoutingTableEntry;
    console.log('OPEN ROUTES: ' + Array.from(this.openRoutes.keys()).toLocaleString());
    if ((storedEntry = this.openRoutes.get(entry.routeKey)) != null) {
      console.log('OPEN ROUTE FOUND');
      if (entry.rplId !== storedEntry.rplId) {
        console.log('rpl id collision');
        return false;
      }

      if (entry.rankHigh !== storedEntry.rankHigh) {
        console.log('ranks collision');
        return false;
      }
      entry.linkHeaderToRoot = storedEntry.linkHeaderToRoot;
      this.parentRoutes.set(entry.routeKey, entry);
      this.openRoutes.delete(entry.routeKey);
      this.discoveryTable.next(Array.from(this.openRoutes.values()));
      this.parentTable.next(Array.from(this.parentRoutes.values()));
      return true;
    } else if ((storedEntry = this.parentRoutes.get(entry.routeKey)) != null) {
      if (entry.rplId !== storedEntry.rplId) {
        console.log('rpl id collision');
        return false;
      }

      if (entry.rankHigh > storedEntry.rankHigh
        || entry.routeLength >= storedEntry.routeLength) {
        console.log('no improvement');
        return false;
      }

      entry.linkHeaderToRoot = storedEntry.linkHeaderToRoot;
      this.parentRoutes.set(entry.routeKey, entry);
      this.parentTable.next(Array.from(this.parentRoutes.values()));
      return true;
    }
    return false;
  }

  getLinkHeader(origin: string, destination: string) {

    console.log('DISCOVER_: 6A');
    if (destination.startsWith('ff')) {

      console.log('DISCOVER_: B');
      return this.multicastLinkHeader;
    }
    let entry: RoutingTableEntry;
    if (origin === this.interfaceId) {
      if ((entry = this.rootRoutes.get(origin + '/' + destination)) != null) {
        console.log('::: TO CHILD? : '
          + this.macId.address + ' ' + entry.linkHeaderToChild.linkSource + ' => ' + entry.linkHeaderToChild.linkDestination);
        return entry.linkHeaderToChild;
      } else if ((entry = this.childRoutes.get(destination + '/' + origin)) != null) {
        return entry.linkHeaderToRoot;
      } else {
        console.log('No root or child path to to destination: ' + destination);
        return null;
      }
    } else {
      if ((entry = this.parentRoutes.get(origin + '/' + destination)) != null) {
        return entry.linkHeaderToChild;
      } else if ((entry = this.parentRoutes.get(destination + '/' + origin)) != null) {
        return entry.linkHeaderToRoot;
      } else {
        console.log('No parent path to to destination: ' + destination);
        return null;
      }
    }
  }

  getHopLimit(origin: string, destination: string): number {
    if (this.rootRoutes.has(origin + '/' + destination)) {
      return this.rootRoutes.get(origin + '/' + destination).routeLength;
    }

    if (this.childRoutes.has(destination + '/' + origin)) {
      return this.childRoutes.get(destination + '/' + origin).routeLength;
    }
    return null;
  }

  deleteRoute(destAddress: string, sourceAddress: string) {

    const  keyA = destAddress + '/' + sourceAddress;
    const  keyB = sourceAddress + '/' + destAddress;
    if (this.rootRoutes.delete(keyA) || this.rootRoutes.delete(keyB)) {
      this.rootTable.next(Array.from(this.rootRoutes.values()));
    } else if (this.childRoutes.delete(keyA) || this.childRoutes.delete(keyB)) {
      this.childTable.next(Array.from(this.childRoutes.values()));
    } else if (this.parentRoutes.delete(keyA) || this.parentRoutes.delete(keyB)) {
      this.parentTable.next(Array.from(this.parentRoutes.values()));
    }
  }
}
