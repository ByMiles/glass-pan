import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppComponent } from './app.component';
import { StartComponent } from './start/start.component';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {MacService} from './mac/mac.service';
import {UrlService} from './url/url.service';
import {StartService} from './start/start.service';
import { UrlComponent } from './url/url.component';
import { MacComponent } from './mac/mac.component';
import { SerialComponent } from './serial/serial.component';
import { MacSendComponent } from './mac-send/mac-send.component';
import { MacReceiveComponent } from './mac-receive/mac-receive.component';
import {MacSendService} from './mac-send/mac-send.service';
import {MacReceiveService} from './mac-receive/mac-receive.service';
import { LpanSendComponent } from './lpan-send/lpan-send.component';
import { LpanReceiveComponent } from './lpan-receive/lpan-receive.component';
import { IpComponent } from './ip/ip.component';
import { IpPacketComponent } from './ip-packet/ip-packet.component';
import {LpanTagService} from './lpan-tag/lpan-tag.service';
import {IpService} from './ip/ip.service';
import {LpanSendService} from './lpan-send/lpan-send.service';
import {LpanReceiveService} from './lpan-receive/lpan-receive.service';
import {DemoService} from './demo/demo.service';
import { DemoComponent } from './demo/demo.component';
import { RoutingTableComponent } from './routing-table/routing-table.component';
import { RplP2pDemoComponent } from './rpl-p2p-demo/rpl-p2p-demo.component';
import {RplP2pDemoService} from './rpl-p2p-demo/rpl-p2p-demo.service';

@NgModule({
  declarations: [
    AppComponent,
    StartComponent,
    UrlComponent,
    MacComponent,
    SerialComponent,
    MacSendComponent,
    MacReceiveComponent,
    LpanSendComponent,
    LpanReceiveComponent,
    IpComponent,
    IpPacketComponent,
    DemoComponent,
    RoutingTableComponent,
    RplP2pDemoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    DragDropModule
  ],
  providers: [
    UrlService,
    StartService,
    MacService,
    MacSendService,
    MacReceiveService,
    LpanTagService,
    IpService,
    LpanSendService,
    LpanReceiveService,
    DemoService,
    RplP2pDemoService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
