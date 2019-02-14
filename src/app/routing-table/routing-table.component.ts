import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {RoutingTableService} from './routing-table.service';
import {RoutingTableEntry} from './RoutingTableEntry';

@Component({
  selector: 'app-routing-table',
  templateUrl: './routing-table.component.html',
  styleUrls: ['./routing-table.component.scss']
})
export class RoutingTableComponent implements OnInit {

  rootEntries: RoutingTableEntry[];
  parentEntries: RoutingTableEntry[];
  childEntries: RoutingTableEntry[];
  neighbours: Map<number, number[]>;

  constructor(private tableService: RoutingTableService,
              private ref: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.tableService.rootTable.asObservable().subscribe(
      next => {
        this.rootEntries = next;
        this.ref.detectChanges();
      });
    this.tableService.parentTable.asObservable().subscribe(
      next => {
        this.parentEntries = next;
        this.ref.detectChanges();
      });
    this.tableService.childTable.asObservable().subscribe(
      next => {
        this.childEntries = next;
        this.ref.detectChanges();
      });
    this.tableService.neighbours.subscribe(
      next => {
        this.neighbours = next;

        this.ref.detectChanges();
      });
  }

}
