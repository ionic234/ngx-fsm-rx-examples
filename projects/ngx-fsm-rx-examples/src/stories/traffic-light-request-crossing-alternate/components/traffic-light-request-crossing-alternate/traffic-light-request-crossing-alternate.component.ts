
/*eslint-disable*/
import type { SimpleChanges } from '@angular/core';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { BaseStateData, CurrentStateInfo, OnEnterStateChanges, OnLeaveStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { UniqueCustomData } from 'ngx-fsm-rx/utils';
import { switchMap, timer } from 'rxjs';
import { CrossingControlBoxStates } from '../../../traffic-light-request-crossing/components/crossing-control-box/crossing-control-box.component';

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

type TrafficLightRequestCrossingAlternateCanLeaveToMap = Omit<TrafficLightCanLeaveToMap, "prepareToStop"> & {
  prepareToStop: "stop" | "stop_startWalking";
  stop_startWalking: "stop_finishWalking";
  stop_finishWalking: "stop";
};
@Component({
  selector: 'lib-traffic-light-request-crossing-alternate',
  templateUrl: './traffic-light-request-crossing-alternate.component.html',
  styleUrls: ['./traffic-light-request-crossing-alternate.component.scss']
})
export class TrafficLightRequestCrossingAlternateComponent extends FsmRxComponent<
  TrafficLightStates,
  TrafficLightRequestCrossingData,
  TrafficLightCanLeaveToMap
>{

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
        onEnter: this.handleEnterState,
        onLeave: this.handleLeavePrepareToStop
      },
      stop_startWalking: {
        canEnterFromStates: { prepareToStop: true },
        canLeaveToStates: { stop_finishWalking: true },
        onEnter: (onEnterStateData: OnEnterStateChanges<TrafficLightStates, "stop_startWalking", TrafficLightRequestCrossingData, TrafficLightRequestCrossingAlternateCanLeaveToMap>) => {
          this.outputCrossingControlBoxState.emit("startWalking");
          this.handleEnterState(onEnterStateData);
        }
      },
      stop_finishWalking: {
        canEnterFromStates: { stop_startWalking: true },
        canLeaveToStates: { stop: true },
        onEnter: (onEnterStateData: OnEnterStateChanges<TrafficLightStates, "stop_finishWalking", TrafficLightRequestCrossingData, TrafficLightRequestCrossingAlternateCanLeaveToMap>) => {
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
        onEnter: this.handleEnterState
      }
    };

  public constructor() {
    super({ debugLogBufferCount: 25 });
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.changeState({ state: "go", trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000, stop_finishWalking: 2100, stop_startWalking: 3000 }, pedestrianCrossingRequested: false });
  }

  public override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);

    if (changes["walkButtonEvent"] && changes["walkButtonEvent"].currentValue) {
      this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingAlternateCanLeaveToMap>) => {
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

  private handleEnterState(onEnterStateChanges: OnEnterStateChanges<TrafficLightStates, TrafficLightStates, TrafficLightRequestCrossingData, TrafficLightRequestCrossingAlternateCanLeaveToMap>): void {
    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData } = enteringStateInfo;
    const { trafficLightTimings, state } = stateData;
    this.delayToStateChange(trafficLightTimings[state]);
  }

  private delayToStateChange(delay: number) {

    timer(delay)
      .pipe(
        switchMap(() => { return this.currentState$; })
      )
      .subscribe((currentStateInfo: CurrentStateInfo<TrafficLightStates, TrafficLightRequestCrossingData, TrafficLightCanLeaveToMap>) => {

        const { stateData, state, canLeaveTo } = currentStateInfo;

        if (state === "FSMInit") { return; }
        let nextState = canLeaveTo[0];
        this.changeState({
          ...stateData,
          pedestrianCrossingRequested: state === "stop_startWalking" ? false : stateData.pedestrianCrossingRequested,
          state: nextState
        });

      });
  }

  private handleLeavePrepareToStop(onLeaveStateData: OnLeaveStateChanges<TrafficLightStates, "prepareToStop", TrafficLightRequestCrossingData, TrafficLightRequestCrossingAlternateCanLeaveToMap>): boolean {

    const { stateData } = onLeaveStateData.enteringStateInfo;
    const { trafficLightTimings, pedestrianCrossingRequested } = stateData;

    if (pedestrianCrossingRequested) {
      this.changeState({
        state: "stop_startWalking",
        pedestrianCrossingRequested: false,
        trafficLightTimings
      });

      return false;
    }

    return true;
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
