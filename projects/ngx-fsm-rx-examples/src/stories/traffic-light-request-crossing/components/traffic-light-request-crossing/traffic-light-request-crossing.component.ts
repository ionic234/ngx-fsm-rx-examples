/*eslint-disable*/
import type { AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { BaseStateData, CurrentStateInfo, OnEnterStateChanges, StateMap } from 'fsm-rx';
import { switchMap, timer } from 'rxjs';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { UniqueCustomData } from 'ngx-fsm-rx/utils';
import type { CrossingControlBoxStates } from '../crossing-control-box/crossing-control-box.component';

type TrafficLightStates = "go" | "prepareToStop" | "stop" | "stop_startWalking" | "stop_finishWalking";

type TrafficLightTimings = {
  go: 7000,
  prepareToStop: 3000,
  stop: 10000;
  stop_startWalking: 3000,
  stop_finishWalking: 2100;
};

export interface TrafficLightRequestCrossingData extends BaseStateData<TrafficLightStates> {
  pedestrianCrossingRequested: boolean;
  trafficLightTimings: TrafficLightTimings;
}

type TrafficLightCanLeaveToMap = {
  FSMInit: "go",
  go: "prepareToStop",
  stop: "go",
  prepareToStop: "stop" | "stop_startWalking";
  stop_startWalking: "stop_finishWalking";
  stop_finishWalking: "stop";
};

@Component({
  selector: 'lib-traffic-light-request-crossing',
  templateUrl: './traffic-light-request-crossing.component.html',
  styleUrls: ['./traffic-light-request-crossing.component.scss']
})
export class TrafficLightRequestCrossingComponent extends FsmRxComponent<
  TrafficLightStates,
  TrafficLightRequestCrossingData,
  TrafficLightCanLeaveToMap
> implements AfterViewInit, OnChanges {

  @Input() public walkButtonEvent: UniqueCustomData | undefined;
  @Output() public outputCrossingControlBoxState: EventEmitter<CrossingControlBoxStates> = new EventEmitter();

  protected override stateMap: StateMap<
    TrafficLightStates,
    TrafficLightRequestCrossingData,
    TrafficLightCanLeaveToMap
  > = {
      go: {
        canEnterFromStates: { FSMInit: true, stop: true },
        canLeaveToStates: { prepareToStop: true },
        onEnter: this.handleEnterState
      },
      prepareToStop: {
        canEnterFromStates: { go: true, },
        canLeaveToStates: { stop: true, stop_startWalking: true },
        onEnter: this.handleEnterState
      },
      stop_startWalking: {
        canEnterFromStates: { prepareToStop: true },
        canLeaveToStates: { stop_finishWalking: true },
        onEnter: (onEnterStateData: OnEnterStateChanges<TrafficLightStates, "stop_startWalking", TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>) => {
          this.outputCrossingControlBoxState.emit("startWalking");
          this.handleEnterState(onEnterStateData);
        }
      },
      stop_finishWalking: {
        canEnterFromStates: { stop_startWalking: true },
        canLeaveToStates: { stop: true },
        onEnter: (onEnterStateData: OnEnterStateChanges<TrafficLightStates, "stop_finishWalking", TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>) => {
          this.outputCrossingControlBoxState.emit("finishWalking");
          this.handleEnterState(onEnterStateData);
        },
        onLeave: () => {
          this.outputCrossingControlBoxState.emit("doNotWalk");
        }
      },
      stop: {
        canEnterFromStates: { prepareToStop: true, stop_finishWalking: true },
        canLeaveToStates: { go: true },
        onEnter: this.handleEnterStop
      },
    };

  public constructor() {
    super();
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.changeState({ state: "go", trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000, stop_finishWalking: 2100, stop_startWalking: 3000 }, pedestrianCrossingRequested: false });
  }

  public override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);

    if (changes["walkButtonEvent"] && changes["walkButtonEvent"].currentValue) {
      this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>) => {
        const { stateData, canUpdate } = currentStateInfo;
        if (canUpdate) {
          this.updateState({
            ...stateData,
            pedestrianCrossingRequested: true
          });
        }
      });
    }

  }

  private handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, Exclude<TrafficLightStates, "stop">, TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>): void {
    const { enteringStateInfo } = onEnterStateChanges;
    const { state, stateData } = enteringStateInfo;
    const { trafficLightTimings } = stateData;
    this.delayToStateChange(trafficLightTimings[state]);
  }

  private delayToStateChange(delay: number) {
    timer(delay)
      .pipe(switchMap(() => { return this.currentState$; }))
      .subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>) => {
        const { stateData, state, canLeaveTo } = currentStateInfo;
        if (state === "FSMInit") { return; }

        let nextState = canLeaveTo[0];
        if (state === "prepareToStop") {
          nextState = stateData.pedestrianCrossingRequested ? "stop_startWalking" : "stop";
        }

        this.changeState({
          ...stateData,
          pedestrianCrossingRequested: state === "stop_startWalking" ? false : stateData.pedestrianCrossingRequested,
          state: nextState
        });

      });

  }

  private handleEnterStop(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, "stop", TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>) {

    const { leavingStateInfo, enteringStateInfo } = onEnterStateChanges;
    const { stateData } = enteringStateInfo;
    const { trafficLightTimings } = stateData;

    const delay: number = leavingStateInfo.state !== "stop_finishWalking" ? trafficLightTimings.stop : trafficLightTimings.stop - (trafficLightTimings.stop_startWalking + trafficLightTimings.stop_finishWalking);
    this.delayToStateChange(delay);

  }

  protected override generateStateTransition(state: TrafficLightStates | 'FSMInit', canLeaveTo: TrafficLightStates[]): string {

    if (state !== "prepareToStop") {
      return super.generateStateTransition(state, canLeaveTo);
    }

    return `state if_requested <<choice>> 
    prepareToStop --> if_requested
    if_requested --> stop: pedestrianCrossingRequested === false
    if_requested --> stop_startWalking: pedestrianCrossingRequested === true`;
  }

}