
/*eslint-disable*/
import { Component, Input } from '@angular/core';
import { CrossingControlBoxStates } from '../../../traffic-light-request-crossing/components/crossing-control-box/crossing-control-box.component';
import { UniqueCustomData } from 'ngx-fsm-rx/utils';
import { BaseFsmComponentConfig } from 'ngx-fsm-rx/lib/classes/fsm-rx-component/fsm-rx-component.types';

@Component({
  selector: 'lib-request-crossing-assembly-alternate',
  templateUrl: './request-crossing-assembly-alternate.component.html',
  styleUrls: ['./request-crossing-assembly-alternate.component.scss']
})
export class RequestCrossingAssemblyAlternateComponent {
  public walkButtonEvent: UniqueCustomData | undefined;
  public crossingControlBoxState: CrossingControlBoxStates | undefined;

  @Input() public fsmConfig: Partial<BaseFsmComponentConfig> = {};

  public constructor() { }

  public handleOutputWalkButtonClicked(walkButtonEvent: UniqueCustomData): void {
    this.walkButtonEvent = walkButtonEvent;
  };

  public handleOutputPedestrianCrossingStates(crossingControlBoxState: CrossingControlBoxStates): void {
    this.crossingControlBoxState = crossingControlBoxState;
  }

}