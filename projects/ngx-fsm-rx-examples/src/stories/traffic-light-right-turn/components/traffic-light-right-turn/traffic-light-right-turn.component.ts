/*eslint-disable*/
import { AfterViewInit, Component } from '@angular/core';
import { BaseStateData, CurrentStateInfo, FSMInit, OnEnterStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { timer } from 'rxjs';

type TrafficLightStates = "go" | "prepareToStop" | "stop" | "stopWithRightTurn";

type TrafficLightTimings = {
  go: 7000,
  prepareToStop: 3000,
  stop: 7000;
  stopWithRightTurn: 3000,
};

interface TrafficLightData extends BaseStateData<TrafficLightStates> {
  trafficLightTimings: TrafficLightTimings;
}

type TrafficLightCanLeaveToMap = {
  FSMInit: "go",
  go: "prepareToStop",
  prepareToStop: "stop",
  stop: "stopWithRightTurn";
  stopWithRightTurn: "go",
};

@Component({
  selector: 'lib-traffic-right-turn',
  templateUrl: './traffic-light-right-turn.component.html',
  styleUrls: ['./traffic-light-right-turn.component.scss']
})
export class TrafficLightRightTurnComponent extends FsmRxComponent<
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
        canEnterFromStates: { FSMInit: true, stopWithRightTurn: true },
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
        canLeaveToStates: { stopWithRightTurn: true },
        onEnter: this.handleEnterState
      },
      stopWithRightTurn: {
        canEnterFromStates: { stop: true },
        canLeaveToStates: { go: true },
        onEnter: this.handleEnterState
      },
    };

  public constructor() {
    super();
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) => {
      const { state } = currentStateInfo;
      if (state === "FSMInit") {
        this.changeState<FSMInit>({ state: "go", trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 7000, stopWithRightTurn: 3000 } });
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
