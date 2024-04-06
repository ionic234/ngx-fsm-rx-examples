/*eslint-disable*/
import { AfterViewInit, Component } from '@angular/core';
import { BaseStateData, CurrentStateInfo, FSMInit, OnEnterStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { timer } from 'rxjs';

// Define the states the traffic light component can be in 
type TrafficLightStates = "go" | "prepareToStop" | "stop";

type TrafficLightTimings = {
  go: 7000,
  prepareToStop: 3000,
  stop: 10000;
};

interface TrafficLightData extends BaseStateData<TrafficLightStates> {
  trafficLightTimings: TrafficLightTimings;
}

type TrafficLightCanLeaveToMap = {
  FSMInit: "go",
  go: "prepareToStop",
  prepareToStop: "stop",
  stop: "go";
};

@Component({
  selector: 'lib-traffic-light-simple',
  templateUrl: './traffic-light-simple.component.html',
  styleUrls: ['./traffic-light-simple.component.scss']
})
export class TrafficLightSimpleComponent extends FsmRxComponent<
  TrafficLightStates,
  TrafficLightData,
  TrafficLightCanLeaveToMap
> implements AfterViewInit {

  protected override stateMap: StateMap<
    TrafficLightStates,
    TrafficLightData,
    TrafficLightCanLeaveToMap
  > = {
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
        canEnterFromStates: { prepareToStop: true },
        canLeaveToStates: { go: true },
        onEnter: this.handleEnterState
      }
    };

  public constructor() {
    super();
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
    const { stateData, state, canLeaveTo } = enteringStateInfo;
    const { trafficLightTimings } = stateData;

    timer(trafficLightTimings[state])
      .subscribe(() => {
        this.changeState({
          ...stateData,
          state: canLeaveTo[0]
        });
      });
  }

}
