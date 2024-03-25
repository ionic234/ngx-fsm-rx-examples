/*eslint-disable*/
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { BaseStateData, CurrentStateInfo, OnEnterStateChanges, OnUpdateStateChanges, StateMap } from 'fsm-rx';
import { FsmRxComponent } from 'ngx-fsm-rx';
import { UniqueCustomData, UniqueDataService } from 'ngx-fsm-rx/utils';
import { interval, switchMap, takeUntil } from 'rxjs';

export type CrossingControlBoxStates = "doNotWalk" | "startWalking" | "finishWalking";

interface BaseCrossingControlBoxData extends BaseStateData<CrossingControlBoxStates> {
    isWalkLightOn: boolean,
    isWalkRequestIndicatorOn: boolean;
}

interface DoNotWalkCrossingControlBoxData extends BaseCrossingControlBoxData {
    state: "doNotWalk",
    isWalkLightOn: false;
    isWalkRequestIndicatorOn: boolean;
}

interface StartWalkingCrossingControlBoxData extends BaseCrossingControlBoxData {
    state: "startWalking",
    isWalkLightOn: true,
    isWalkRequestIndicatorOn: true;
}

interface FinishWalkingCrossingControlBoxData extends BaseCrossingControlBoxData {
    state: "finishWalking",
    flashInterval: 350;
    isWalkLightOn: boolean,
    isWalkRequestIndicatorOn: boolean;
}

type CrossingControlBoxData = DoNotWalkCrossingControlBoxData | StartWalkingCrossingControlBoxData | FinishWalkingCrossingControlBoxData;

type CrossingControlBoxCanLeaveToMap = {
    FSMInit: "doNotWalk",
    doNotWalk: "startWalking",
    startWalking: "finishWalking",
    finishWalking: "doNotWalk";
};

@Component({
    selector: 'lib-crossing-control-box',
    templateUrl: './crossing-control-box.component.html',
    styleUrls: ['./crossing-control-box.component.scss']
})
export class CrossingControlBoxComponent extends FsmRxComponent<
    CrossingControlBoxStates,
    CrossingControlBoxData,
    CrossingControlBoxCanLeaveToMap
>{

    @Output() public outputWalkButtonClicked: EventEmitter<UniqueCustomData> = new EventEmitter();
    @Input() public crossingControlBoxState: CrossingControlBoxStates | undefined;

    protected override stateMap: StateMap<
        CrossingControlBoxStates,
        CrossingControlBoxData,
        CrossingControlBoxCanLeaveToMap
    > = {
            doNotWalk: {
                canEnterFromStates: { FSMInit: true, finishWalking: true },
                canLeaveToStates: { startWalking: true },
                onUpdate: this.emitOutputWalkButtonClicked
            },
            startWalking: {
                canEnterFromStates: { doNotWalk: true },
                canLeaveToStates: { finishWalking: true }
            },
            finishWalking: {
                canEnterFromStates: { startWalking: true },
                canLeaveToStates: { doNotWalk: true },
                onEnter: this.handleEnterFinishWalking,
                onUpdate: this.emitOutputWalkButtonClicked,
            }
        };

    public constructor(private uniqueDataService: UniqueDataService) {
        super({ debugLogBufferCount: 10 });
    }

    public override ngAfterViewInit(): void {
        super.ngAfterViewInit();
        this.changeState({ state: "doNotWalk", isWalkLightOn: false, isWalkRequestIndicatorOn: false });
    }

    public override ngOnChanges(changes: SimpleChanges): void {
        super.ngOnChanges(changes);
        if (changes["crossingControlBoxState"] && changes["crossingControlBoxState"].currentValue) {
            const crossingControlBoxState: CrossingControlBoxStates = changes["crossingControlBoxState"].currentValue;
            this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) => {

                const { stateData, state, canLeaveTo } = currentStateInfo;

                if (state === "FSMInit") { return; }
                if (!canLeaveTo.some((needleState: CrossingControlBoxStates) => { return needleState === crossingControlBoxState; })) { return; };

                switch (crossingControlBoxState) {
                    case "startWalking":
                        this.changeState({
                            state: crossingControlBoxState,
                            isWalkLightOn: true,
                            isWalkRequestIndicatorOn: true
                        });
                        break;
                    case "finishWalking":
                        this.changeState({
                            state: crossingControlBoxState,
                            isWalkLightOn: true,
                            isWalkRequestIndicatorOn: false,
                            flashInterval: 350
                        });
                        break;
                    case "doNotWalk":
                        this.changeState({
                            state: crossingControlBoxState,
                            isWalkLightOn: false,
                            isWalkRequestIndicatorOn: stateData.isWalkRequestIndicatorOn
                        });
                        break;
                    default:
                        this.assertCannotReach(crossingControlBoxState);
                }

            });
        }
    }

    private emitOutputWalkButtonClicked(OnUpdateStateChanges: OnUpdateStateChanges<CrossingControlBoxStates, "finishWalking" | "doNotWalk", CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) {
        const { previousInfo, updateInfo } = OnUpdateStateChanges;
        const { stateData: previousStateData } = previousInfo;
        const { stateData: updateStateData } = updateInfo;

        if (previousStateData.isWalkRequestIndicatorOn !== updateStateData.isWalkRequestIndicatorOn && updateStateData.isWalkRequestIndicatorOn) {
            this.outputWalkButtonClicked.emit(this.uniqueDataService.generateUniqueCustomData());
        }
    }

    private handleEnterFinishWalking(onEnterStateChanges: OnEnterStateChanges<CrossingControlBoxStates, "finishWalking", CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>): void {

        const { enteringStateInfo } = onEnterStateChanges;
        const { stateData } = enteringStateInfo;
        const { flashInterval } = stateData;

        interval(flashInterval).pipe(
            takeUntil(this.nextChangeStateTransition$),
            takeUntil(this.destroy$),
            switchMap(() => { return this.currentState$; }),
        ).subscribe((currentStateInfo: CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) => {

            const { state: currentState, stateData: currentStateData } = currentStateInfo;

            if (currentState === "finishWalking") {
                const { isWalkLightOn } = currentStateData;
                this.updateState({
                    ...currentStateData,
                    isWalkLightOn: !isWalkLightOn
                });
            }
        });

    }

    public handleWalkButtonClicked(): void {
        this.currentState$.subscribe(
            (currentStateInfo: CurrentStateInfo<CrossingControlBoxStates, CrossingControlBoxData, CrossingControlBoxCanLeaveToMap>) => {
                const { stateData, state } = currentStateInfo;
                if (state !== "doNotWalk" && state !== "finishWalking") { return; }
                this.updateState({
                    ...stateData,
                    isWalkRequestIndicatorOn: true
                });
            }
        );
    }

}
