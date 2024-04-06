/*eslint-disable*/
import type { AfterViewInit } from '@angular/core';
import { Component } from '@angular/core';
import type { BaseStateData, OnEnterStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';

export type TrafficLightStates = "go" | "prepareToStop" | "stop";

export type TrafficLightTimings = {
  go: 7000,
  prepareToStop: 3000,
  stop: 10000;
};

export interface TrafficLightData extends BaseStateData<TrafficLightStates> {
  trafficLightTimings: TrafficLightTimings;
  stateTimeoutId: number | undefined;
}

export type TrafficLightCanLeaveToMap = {
  FSMInit: "go",
  go: "prepareToStop",
  prepareToStop: "stop",
  stop: "go";
};

@Component({
  selector: 'lib-traffic-light-overridable',
  templateUrl: './traffic-light-overridable.component.html',
  styleUrls: ['./traffic-light-overridable.component.scss']
})
export class TrafficLightOverridableComponent extends FsmRxComponent<
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
    super({ debugLogBufferCount: 10 });
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    if (!this.fsmConfig.stateOverride) {
      this.changeState({ state: "go", stateTimeoutId: undefined, trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } });
    }
  }

  private handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>): void {

    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData } = enteringStateInfo;
    const state = enteringStateInfo.state;

    this.updateState({
      ...stateData,
      stateTimeoutId: window.setTimeout(() => {
        this.changeState({
          ...stateData,
          state: enteringStateInfo.canLeaveTo[0],
          stateTimeoutId: undefined
        });
      }, stateData.trafficLightTimings[state])
    });
  }
}