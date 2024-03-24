import { CommonModule } from '@angular/common';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { ReactiveFormsModule } from '@angular/forms';
import type { UserLoginCanLeaveToMap, UserLoginData, UserLoginStates } from './components/user-login/user-login.component';
import { UserLoginComponent } from './components/user-login/user-login.component';
import type { OnOverrideStateChanges } from 'fsm-rx';
import { FsmRxDebugLogComponent, FsmRxDebugSetComponent, FsmRxStateDiagramComponent } from 'ngx-fsm-rx/testing';

const meta: Meta<UserLoginComponent> = {
    title: 'Examples/8. User Login',
    component: UserLoginComponent,
    decorators: [
        moduleMetadata({
            declarations: [FsmRxDebugLogComponent, FsmRxStateDiagramComponent, FsmRxDebugSetComponent],
            imports: [CommonModule, ReactiveFormsModule],
        }),
        componentWrapperDecorator((story: string) => {
            story = story.replace(">", " #fsmRxComponent>");
            return `<fsm-rx-debug-set [debugLogKeys] = "['state', 'loginAttempts', 'username', 'password', 'errorMessage']">${story}</fsm-rx-debug-set>`;
        })
    ],
    args: {
        fsmConfig: {
            stateDiagramDirection: "TB",
            debugLogBufferCount: 10,
            outputDebugLog: true,
            resetDebugLogOnOverride: false,
            recordResetDataToDebugLog: true,
            stringifyLogTransitionData: false,
            outputStateDiagramDefinition: true,
            outputTransitionRejectionToConsole: true,
        },
        prefillPassword: '12345',
        prefillUsername: "admin"
    },
    parameters: {
        deepControls: { enabled: true },
        controls: {
            exclude: '(loginForm|stateMap|passwordControl|usernameControl|handleEnterAwaitingInput|handleEnterError|handleEnterFrontendValidationCheck|handleEnterLocked|handleEnterSubmittingCredentials|ngAfterViewInit|onTransitionRejected|onUnknownError|submitCredentials|setUsernameAndPassword)'
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
        'fsmConfig.resetDebugLogOnOverride': {
            name: `Reset Debug Log On Override`,
            control: { type: 'boolean' }
        },
        'fsmConfig.stringifyLogTransitionData': {
            name: `Stringify Log Transition Data`,
            control: { type: 'boolean' }
        },
        'fsmConfig.recordResetDataToDebugLog': {
            name: `Record Reset Data to Debug Log`,
            control: { type: 'boolean' }
        },
        'fsmConfig.outputStateDiagramDefinition': {
            name: `Output State Diagram Definition`,
            control: { type: 'boolean' }
        },
        'fsmConfig.outputTransitionRejectionToConsole': {
            name: `Output Transition Rejection To Console`,
            control: { type: 'boolean' }
        },
        'fsmConfig.stateOverride.stateData.state': {
            name: "Override State",
            control: { type: 'select' },
            options: ["awaitingInput", "frontendValidationCheck", "error", "submittingCredentials", "credentialsAccepted", "locked"],
        },
        'fsmConfig.stateOverride.stateData.errorMessage': {
            name: "Error Message",
            if: { arg: 'fsmConfig.stateOverride.stateData.state', eq: 'error' },
            control: { type: "text" }
        },
        'fsmConfig.stateOverride.stateData.lockedSecondsRemaining': {
            control: { type: "number" },
            if: { arg: 'fsmConfig.stateOverride.stateData.state', eq: 'locked' },
            name: "Locked Seconds Remaining",
        },
    }
};

export default meta;
type Story = StoryObj<UserLoginComponent>;

export const Static: Story = {
    argTypes: {
        ...meta.argTypes,
        //eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        'fsmConfig.stateOverride.stateData.username': {
            name: "Override Username",
            control: { type: "text" },
            if: { arg: 'fsmConfig.stateOverride.stateData.state', eq: 'credentialsAccepted' },
        },
    }
};
export const Functional: Story = {
    args: {
        ...meta.args,
        fsmConfig: {
            ...meta.args?.fsmConfig,
            stateOverride: {
                stateData: {
                    state: "awaitingInput",
                    password: "12345",
                    username: "admin",
                },
                onOverride: function (this: UserLoginComponent, onOverrideStateChanges: OnOverrideStateChanges<UserLoginStates, UserLoginData, UserLoginCanLeaveToMap>) {
                    const { overridingStateInfo } = onOverrideStateChanges;
                    const { stateData, state } = overridingStateInfo;
                    switch (state) {
                        case "awaitingInput":
                            this.setUsernameAndPassword(stateData.username, stateData.password);
                            if (this.loginForm.disabled) { this.loginForm.enable(); }
                            this.handleEnterAwaitingInput({
                                hook: "onEnter",
                                leavingStateInfo: {
                                    state: 'FSMInit',
                                    canLeaveTo: ['awaitingInput'],
                                    canUpdate: false,
                                    stateData: {
                                        state: "FSMInit"
                                    }
                                },
                                enteringStateInfo: overridingStateInfo
                            });
                            break;
                        case "frontendValidationCheck": {
                            this.setUsernameAndPassword(stateData.username, stateData.password);
                            if (this.loginForm.disabled) { this.loginForm.enable(); }
                            let transitionResult: boolean | void = false;

                            try {
                                transitionResult = this.handleEnterFrontendValidationCheck(
                                    {
                                        hook: "onEnter",
                                        leavingStateInfo: {
                                            state: "awaitingInput",
                                            canLeaveTo: ['frontendValidationCheck'],
                                            canUpdate: true,
                                            stateData: {
                                                state: "awaitingInput",
                                                password: stateData.password,
                                                username: stateData.username
                                            }
                                        },
                                        enteringStateInfo: overridingStateInfo
                                    }
                                );
                            } catch (error) {
                                transitionResult = false;
                            } finally {
                                if (transitionResult === false) {
                                    this.overrideCurrentState(
                                        {
                                            stateData: {
                                                ...stateData,
                                                state: "awaitingInput",
                                            },
                                            onOverride: () => {
                                                this.changeState(stateData);
                                            }
                                        }
                                    );
                                }
                            }
                            break;
                        }
                        case "error":
                            if (this.loginForm.disabled) { this.loginForm.enable(); }
                            this.setUsernameAndPassword(stateData.username, stateData.password);
                            this.loginForm.updateValueAndValidity();
                            this.handleEnterError({
                                hook: "onEnter",
                                leavingStateInfo: {
                                    state: "frontendValidationCheck",
                                    canLeaveTo: ['error', 'submittingCredentials'],
                                    canUpdate: true,
                                    stateData: {
                                        state: "frontendValidationCheck",
                                        password: stateData.password,
                                        username: stateData.username
                                    }
                                },
                                enteringStateInfo: overridingStateInfo
                            });
                            break;
                        case "submittingCredentials":
                            if (this.loginForm.enabled) { this.loginForm.disable(); }
                            this.setUsernameAndPassword(stateData.username, stateData.password);
                            this.handleEnterSubmittingCredentials({
                                hook: "onEnter",
                                leavingStateInfo: {
                                    state: "frontendValidationCheck",
                                    canLeaveTo: ['error', 'submittingCredentials'],
                                    canUpdate: true,
                                    stateData: {
                                        state: "frontendValidationCheck",
                                        password: stateData.password,
                                        username: stateData.username
                                    }
                                },
                                enteringStateInfo: overridingStateInfo
                            });
                            break;
                        case "locked":
                            if (this.loginForm.enabled) { this.loginForm.disable(); }
                            this.setUsernameAndPassword(stateData.username, stateData.password);
                            this.handleEnterLocked();
                            break;
                        case "credentialsAccepted":
                            this.setUsernameAndPassword(stateData.username);
                            break;
                        default:
                            this.assertCannotReach(state);
                            break;
                    }
                }
            },
        },
    },
    parameters: {
        ...meta.parameters,
        controls: {
            exclude: `${meta.parameters?.['controls'].exclude}|prefillPassword|prefillUsername`
        }
    },
    argTypes: {
        ...meta.argTypes,
        //eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        'fsmConfig.stateOverride.stateData.username': {
            name: "Override Username",
            control: { type: "text" },
            if: { arg: 'fsmConfig.stateOverride.stateData.state', truthy: true },
        },
        'fsmConfig.stateOverride.stateData.password': {
            name: "Override Password",
            control: { type: "text" },
            if: { arg: 'fsmConfig.stateOverride.stateData.state', truthy: true },
        },
    }
};