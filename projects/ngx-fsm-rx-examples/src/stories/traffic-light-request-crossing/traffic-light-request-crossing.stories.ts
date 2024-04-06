import { CommonModule } from '@angular/common';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FsmRxDebugLogComponent, FsmRxDebugSetComponent, FsmRxStateDiagramComponent } from 'ngx-fsm-rx/testing';
import { CrossingControlBoxComponent } from './components/crossing-control-box/crossing-control-box.component';
import { RequestCrossingAssemblyComponent } from './components/request-crossing-assembly/request-crossing-assembly.component';
import { TrafficLightRequestCrossingComponent } from './components/traffic-light-request-crossing/traffic-light-request-crossing.component';

const meta: Meta<RequestCrossingAssemblyComponent> = {
    title: 'Examples/4. Traffic Light Request Crossing',
    component: RequestCrossingAssemblyComponent,
    decorators: [
        moduleMetadata({
            declarations: [FsmRxDebugLogComponent, FsmRxStateDiagramComponent, FsmRxDebugSetComponent, TrafficLightRequestCrossingComponent, CrossingControlBoxComponent],
            imports: [CommonModule],
        })
    ],
    args: {
        fsmConfig: {
            stateDiagramDirection: "TB",
            debugLogBufferCount: 10,
            outputDebugLog: true,
            stringifyLogTransitionData: false,
            outputStateDiagramDefinition: true,
            filterRepeatUpdates: true,
            recordFilteredUpdatesToDebugLog: true
        }
    },
    argTypes: {
        fsmConfig: {
            table: { disable: true }
        },
        //eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        'fsmConfig.stateDiagramDirection': {
            control: { type: 'select' },
            options: ["LR", "TB"],
            name: 'State Diagram Direction'
        },
        'fsmConfig.debugLogBufferCount': {
            name: ' Debug Log Buffer Count',
            control: { type: 'number' }
        },
        'fsmConfig.outputDebugLog': {
            name: `Output Debug Log`,
            control: { type: 'boolean' }
        },
        'fsmConfig.stringifyLogTransitionData': {
            name: `Stringify Log Transition Data`,
            control: { type: 'boolean' }
        },
        'fsmConfig.outputStateDiagramDefinition': {
            name: `Output State Diagram Definition`,
            control: { type: 'boolean' }
        },
        'fsmConfig.filterRepeatUpdates': {
            name: `Filter Repeat Updates`,
            control: { type: 'boolean' }
        },
        'fsmConfig.recordFilteredUpdatesToDebugLog': {
            name: `Record Filtered Updates To Debug Log`,
            control: { type: 'boolean' }
        },
    },

    parameters: {
        deepControls: { enabled: true },
        controls: {
            exclude: '(crossingControlBoxState|walkButtonEvent|handleOutputPedestrianCrossingStates|handleOutputWalkButtonClicked)'
        }
    }
};

export default meta;
type Story = StoryObj<RequestCrossingAssemblyComponent>;

export const Default: Story = {};
