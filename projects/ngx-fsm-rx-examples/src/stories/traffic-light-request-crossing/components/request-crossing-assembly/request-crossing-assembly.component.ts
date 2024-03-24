
/*eslint-disable*/
import { Component, Input } from '@angular/core';
import { BaseFsmComponentConfig } from 'ngx-fsm-rx/lib/classes/fsm-rx-component/fsm-rx-component.types';
import { UniqueCustomData } from 'ngx-fsm-rx/utils';
import { CrossingControlBoxStates } from '../crossing-control-box/crossing-control-box.component';

@Component({
  selector: 'lib-request-crossing-assembly',
  templateUrl: './request-crossing-assembly.component.html',
  styleUrls: ['./request-crossing-assembly.component.scss']
})
export class RequestCrossingAssemblyComponent {
  public walkButtonEvent: UniqueCustomData | undefined;
  public crossingControlBoxState: CrossingControlBoxStates | undefined;

  @Input() public fsmConfig: Partial<BaseFsmComponentConfig> = {};

  public constructor() { }

  public handleOutputWalkButtonClicked(walkButtonData: UniqueCustomData): void {
    this.walkButtonEvent = walkButtonData;
  };

  public handleOutputPedestrianCrossingStates(crossingControlBoxState: CrossingControlBoxStates): void {
    this.crossingControlBoxState = crossingControlBoxState;
  }

}