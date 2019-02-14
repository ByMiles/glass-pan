import {Component, Input, OnInit} from '@angular/core';
import {MacId} from '../mac/MacId';

@Component({
  selector: 'app-serial',
  templateUrl: './serial.component.html',
  styleUrls: ['./serial.component.scss']
})
export class SerialComponent implements OnInit {

  @Input() macId: MacId;
  constructor() {
  }

  ngOnInit() {
  }

}
