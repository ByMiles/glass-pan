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
    if (!this.neighboursQualityMap.has(address)) {
      this.neighboursQualityMap.set(address, []);
    }
    this.neighboursQualityMap.get(address).push(quality);
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
    if (entry.childAddress !== this.interfaceId) {
      return false;
    }

    if (!this.childRoutes.has(entry.routeKey)
      || this.newIsBetter(entry, this.childRoutes.get(entry.routeKey))) {

      entry.routeLength = entry.rankHigh - 1;
      this.childRoutes.set(entry.routeKey, entry);
      this.childTable.next(Array.from(this.childRoutes.values()));
      return true;
    }
    return false;
  }

  joinAsRoot(entry: RoutingTableEntry): boolean {
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
   if ((storedEntry = this.openRoutes.get(entry.routeKey)) != null) {
       if (entry.rplId !== storedEntry.rplId) {
        return false;
      }

      if (entry.rankHigh !== storedEntry.rankHigh) {
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
        return false;
      }

      if (entry.rankHigh > storedEntry.rankHigh
        || entry.routeLength >= storedEntry.routeLength) {
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

    if (destination.startsWith('ff')) {

      return this.multicastLinkHeader;
    }
    let entry: RoutingTableEntry;
    if (origin === this.interfaceId) {
      if ((entry = this.rootRoutes.get(origin + '/' + destination)) != null) {
        return entry.linkHeaderToChild;
      } else if ((entry = this.childRoutes.get(destination + '/' + origin)) != null) {
        return entry.linkHeaderToRoot;
      } else {
        return null;
      }
    } else {
      if ((entry = this.parentRoutes.get(origin + '/' + destination)) != null) {
        return entry.linkHeaderToChild;
      } else if ((entry = this.parentRoutes.get(destination + '/' + origin)) != null) {
        return entry.linkHeaderToRoot;
      } else {
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
