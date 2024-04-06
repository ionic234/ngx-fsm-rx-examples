import { CommonModule } from '@angular/common';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FsmRxDebugLogComponent, FsmRxDebugSetComponent, FsmRxStateDiagramComponent } from 'ngx-fsm-rx/testing';
import { TrafficLightRightTurnComponent } from './components/traffic-light-right-turn/traffic-light-right-turn.component';

const meta: Meta<TrafficLightRightTurnComponent> = {
    title: 'Examples/2. Traffic Light Right Turn',
    component: TrafficLightRightTurnComponent,
    decorators: [
        moduleMetadata({
            declarations: [FsmRxDebugLogComponent, FsmRxStateDiagramComponent, FsmRxDebugSetComponent],
            imports: [CommonModule],
        }),
        componentWrapperDecorator((story: string) => {
            story = story.replace(">", " #fsmRxComponent>");
            return `<fsm-rx-debug-set>${story}</fsm-rx-debug-set>`;
        })
    ],
    args: {
        fsmConfig: {
            stateDiagramDirection: "TB",
            debugLogBufferCount: 10,
            outputDebugLog: true,
            stringifyLogTransitionData: false,
            outputStateDiagramDefinition: true,
        }
    },
    parameters: {
        deepControls: { enabled: true },
        controls: {
            exclude: '(stateMap|handleEnterState|ngAfterViewInit|trafficLightTimings)'
        }
    },
    argTypes: {
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
    }
};

export default meta;
type Story = StoryObj<TrafficLightRightTurnComponent>;

export const Default: Story = {};
