/*eslint-disable*/
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BaseStateData, CurrentStateInfo, FSMInit, OnEnterStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { timer } from 'rxjs';

export type TrafficLightStates = "go" | "prepareToStop" | "stop";

export type TrafficLightTimings = {
  go: 7000,
  prepareToStop: 3000,
  stop: 10000;
};

export interface TrafficLightData extends BaseStateData<TrafficLightStates> {
  trafficLightTimings: TrafficLightTimings;
}

export type TrafficLightCanLeaveToMap = {
  FSMInit: "go" | "stop",
  go: "prepareToStop",
  prepareToStop: "stop",
  stop: "go";
};

@Component({
  selector: 'lib-traffic-light-conditional-init',
  templateUrl: './traffic-light-conditional-init.component.html',
  styleUrls: ['./traffic-light-conditional-init.component.scss']
})
export class TrafficLightConditionalInitComponent extends FsmRxComponent<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap> implements OnChanges {

  protected override stateMap: StateMap<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap> = {
    go: {
      canEnterFromStates: { FSMInit: true, stop: true },
      canLeaveToStates: { prepareToStop: true },
      onEnter: this.handleEnterState
    },
    prepareToStop: {
      canEnterFromStates: { go: true },
      canLeaveToStates: { stop: true },
      onEnter: this.handleEnterState
    },
    stop: {
      canEnterFromStates: { prepareToStop: true, FSMInit: true, },
      canLeaveToStates: { go: true },
      onEnter: this.handleEnterState
    }
  };

  @Input() public initState!: Extract<TrafficLightStates, "stop" | "go">;

  public constructor() {
    super({ debugLogBufferCount: 10 });
  }

  public override ngOnChanges(changes: SimpleChanges): void {
    if (changes["initState"] && changes["initState"].firstChange) {
      this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
        const { state } = currentStateInfo;
        if (state === "FSMInit") {
          this.changeState({
            state: changes["initState"].currentValue,
            trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 }
          });
        }
      });

    }
    super.ngOnChanges(changes);
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
      const { state } = currentStateInfo;
      if (state === "FSMInit") {
        this.changeState<FSMInit>({ state: "go", trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } });
      }
    });
  }


  private handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>): void {

    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData, state } = enteringStateInfo;

    timer(stateData.trafficLightTimings[state])
      .subscribe(() => {
        this.changeState({
          ...stateData,
          state: enteringStateInfo.canLeaveTo[0]
        });
      });
  }

}
