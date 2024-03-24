/*eslint-disable*/
import type { AfterViewInit } from '@angular/core';
import { Component } from '@angular/core';
import type { BaseStateData, OnEnterStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { takeUntil, timer } from 'rxjs';

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
  FSMInit: "go",
  go: "prepareToStop",
  prepareToStop: "stop",
  stop: "go";
};

@Component({
  selector: 'lib-traffic-light-overridable-alternate',
  templateUrl: './traffic-light-overridable-alternate.component.html',
  styleUrls: ['./traffic-light-overridable-alternate.component.scss']
})
export class TrafficLightOverridableAlternateComponent extends FsmRxComponent<
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
      this.changeState({ state: "go", trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } });
    }
  }

  private handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>): void {
    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData, state, canLeaveTo } = enteringStateInfo;
    const { trafficLightTimings } = stateData;
    this.createTimer(trafficLightTimings[state], stateData, canLeaveTo[0]);
  }

  protected createTimer(interval: number, stateData: TrafficLightData, transitionTo: TrafficLightStates) {
    timer(interval)
      .pipe(takeUntil(this.override$))
      .subscribe(() => {
        this.changeState({
          ...stateData,
          state: transitionTo
        });
      });
  }

}