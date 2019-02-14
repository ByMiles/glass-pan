import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MacComponent} from './mac/mac.component';
import {StartComponent} from './start/start.component';
import {IpComponent} from './ip/ip.component';
import {RplP2pDemoComponent} from './rpl-p2p-demo/rpl-p2p-demo.component';

const routes: Routes = [

  { path: 'start', component: StartComponent },
  { path: 'mac/:channel/:panId/:address', component: MacComponent },
  { path: 'lpan/:channel/:panId/:address/:mode', component: IpComponent },
  { path: 'p2p/:channel/:panId/:address/:mode', component: RplP2pDemoComponent },
  { path: '**', component: StartComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
