import { CommonModule } from '@angular/common';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import type { OnOverrideStateChanges } from 'fsm-rx';
import { FsmRxDebugLogComponent, FsmRxDebugSetComponent, FsmRxStateDiagramComponent } from 'ngx-fsm-rx/testing';
import type { TrafficLightCanLeaveToMap, TrafficLightData, TrafficLightStates } from './components/traffic-light-overridable-alternate/traffic-light-overridable-alternate.component';
import { TrafficLightOverridableAlternateComponent } from './components/traffic-light-overridable-alternate/traffic-light-overridable-alternate.component';

const meta: Meta<TrafficLightOverridableAlternateComponent> = {
    title: 'Examples/7. Traffic Light Overridable Alternate',
    component: TrafficLightOverridableAlternateComponent,
    decorators: [
        moduleMetadata({
            declarations: [FsmRxDebugLogComponent, FsmRxStateDiagramComponent, FsmRxDebugSetComponent],
            imports: [CommonModule],
        }),
        componentWrapperDecorator((story: string) => {
            story = story.replace(">", " #fsmRxComponent>");
            return `<fsm-rx-debug-set [debugLogKeys]="['state', 'stateTimeoutId']">${story}</fsm-rx-debug-set>`;
        })
    ],
    args: {
        fsmConfig: {
            stateDiagramDirection: "TB",
            debugLogBufferCount: 10,
            outputDebugLog: true,
            resetDebugLogOnOverride: true,
            stringifyLogTransitionData: false,
            outputStateDiagramDefinition: true,
            stateOverride: {
                stateData: {
                    state: "prepareToStop",
                    trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 },
                },
                onOverride: function (this: TrafficLightOverridableAlternateComponent, onOverrideStateChanges: OnOverrideStateChanges<TrafficLightStates, TrafficLightData, TrafficLightCanLeaveToMap>) {
                    const { overridingStateInfo } = onOverrideStateChanges;
                    const { stateData, state, canLeaveTo } = overridingStateInfo;
                    const { trafficLightTimings } = stateData;
                    this.createTimer(trafficLightTimings[state], stateData, canLeaveTo[0]);
                }
            }
        }
    },

    argTypes: {
        //eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        'fsmConfig.stateDiagramDirection': {
            name: 'State Diagram Direction',
            control: { type: 'select' },
            options: ["LR", "TB"],
        },
        'fsmConfig.debugLogBufferCount': {
            name: ' Debug Log Buffer Count',
            control: { type: 'number' },
        },
        'fsmConfig.outputDebugLog': {
            name: `Output Debug Log`,
            control: { type: 'boolean' },
        },
        'fsmConfig.resetDebugLogOnOverride': {
            name: `Reset Debug Log On Override`,
            control: { type: 'boolean' },
        },
        'fsmConfig.stringifyLogTransitionData': {
            name: `Stringify Log Transition Data`,
            control: { type: 'boolean' },
        },
        'fsmConfig.outputStateDiagramDefinition': {
            name: `Output State Diagram Definition`,
            control: { type: 'boolean' },
        },
        'fsmConfig.stateOverride.stateData.state': {
            name: "Override State",
            control: { type: 'select' },
            options: ["go", "prepareToStop", "stop"],
        },
        'fsmConfig.stateOverride.stateData.trafficLightTimings.go': {
            name: "Time in go state",
            control: { type: 'number' },
        },
        'fsmConfig.stateOverride.stateData.trafficLightTimings.prepareToStop': {
            name: "Time in prepare to stop state",
            control: { type: 'number' },
        },
        'fsmConfig.stateOverride.stateData.trafficLightTimings.stop': {
            name: "Time in stop state",
            control: { type: 'number' },
        }
    },

    parameters: {
        deepControls: { enabled: true },
        controls: {
            exclude: '(stateMap|handleEnterState|ngAfterViewInit)'
        }
    }
};

export default meta;
type Story = StoryObj<TrafficLightOverridableAlternateComponent>;

export const Default: Story = {};
