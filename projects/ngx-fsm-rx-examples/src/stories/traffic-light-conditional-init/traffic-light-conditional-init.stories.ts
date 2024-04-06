import { CommonModule } from '@angular/common';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { FsmRxDebugLogComponent, FsmRxDebugSetComponent, FsmRxStateDiagramComponent } from 'ngx-fsm-rx/testing';
import { TrafficLightConditionalInitComponent } from './components/traffic-light-conditional-init/traffic-light-conditional-init.component';

const meta: Meta<TrafficLightConditionalInitComponent> = {
    title: 'Examples/3. Traffic Light Conditional Init',
    component: TrafficLightConditionalInitComponent,
    decorators: [
        moduleMetadata({
            declarations: [FsmRxDebugLogComponent, FsmRxStateDiagramComponent, FsmRxDebugSetComponent],
            imports: [CommonModule],
        }),
        componentWrapperDecorator((story: string) => {
            let storyClone: string = story;
            story = story.replace(">", " #fsmRxComponent >");
            storyClone = storyClone.replace(">", " #fsmRxComponent initState='stop'>");
            return `
                <div [style.display] = "'flex'" [style.gap.px] = "10">
                    <fsm-rx-debug-set [debugLogKeys]="['state']">${story}</fsm-rx-debug-set>
                    <fsm-rx-debug-set [debugLogKeys]="['state']">${storyClone}</fsm-rx-debug-set>
                </div>
            `;
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
    },
    parameters: {
        deepControls: { enabled: true },
        controls: {
            exclude: '(initState|stateMap|handleEnterState|ngOnChanges|ngAfterViewInit)'
        }
    }
};

export default meta;
type Story = StoryObj<TrafficLightConditionalInitComponent>;

export const Default: Story = {};
