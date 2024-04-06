/*eslint-disable*/
import { Component, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BaseStateData, CurrentStateInfo, OnEnterStateChanges, StateMap, StateTransition, TransitionRejection } from 'fsm-rx';
import { Subject, interval, take, takeUntil } from 'rxjs';
import { AuthenticationResults, UserAuthenticationService } from '../../services/user-authentication/user-authentication.service';
import { FsmRxComponent } from 'ngx-fsm-rx';

type FormData = {
  password: string | null,
  username: string | null;
};

type UserLoginFormGroup = {
  password: FormControl<string | null>,
  username: FormControl<string | null>;
};

export type UserLoginStates = "awaitingInput" | "frontendValidationCheck" | "error" | "submittingCredentials" | "credentialsAccepted" | "locked";

interface BaseUserLoginData extends BaseStateData<UserLoginStates> {
  username: string,
  password: string;
}

interface DefaultUserLoginData extends BaseUserLoginData {
  state: "awaitingInput" | "frontendValidationCheck" | "submittingCredentials";
}

interface UserLoginCredentialsAcceptedData extends Omit<BaseUserLoginData, "password"> {
  state: "credentialsAccepted";
}

interface UserLoginErrorData extends BaseUserLoginData {
  state: "error",
  errorMessage: string;
}

interface UserLoginLockedData extends BaseUserLoginData {
  state: "locked",
  lockedSecondsRemaining: number;
  errorMessage: string;
}

export type UserLoginData = DefaultUserLoginData | UserLoginErrorData | UserLoginLockedData | UserLoginCredentialsAcceptedData;

export type UserLoginCanLeaveToMap = {
  FSMInit: "awaitingInput",
  awaitingInput: "frontendValidationCheck",
  frontendValidationCheck: "submittingCredentials" | "error",
  error: "awaitingInput",
  submittingCredentials: "error" | "locked" | "credentialsAccepted",
  credentialsAccepted: "FSMTerminate";
  locked: "error";
};

@Component({
  selector: 'lib-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss']
})
export class UserLoginComponent extends FsmRxComponent<UserLoginStates, UserLoginData, UserLoginCanLeaveToMap> {

  protected override stateMap: StateMap<UserLoginStates, UserLoginData, UserLoginCanLeaveToMap> = {
    awaitingInput: {
      canEnterFromStates: { error: true, FSMInit: true },
      canLeaveToStates: { frontendValidationCheck: true },
      onEnter: this.handleEnterAwaitingInput,
    },
    frontendValidationCheck: {
      canEnterFromStates: { awaitingInput: true },
      canLeaveToStates: { error: true, submittingCredentials: true },
      onEnter: this.handleEnterFrontendValidationCheck
    },
    error: {
      canEnterFromStates: { frontendValidationCheck: true, locked: true, submittingCredentials: true },
      canLeaveToStates: { awaitingInput: true },
      onEnter: this.handleEnterError
    },
    submittingCredentials: {
      canEnterFromStates: { frontendValidationCheck: true },
      canLeaveToStates: { error: true, locked: true, credentialsAccepted: true },
      onEnter: this.handleEnterSubmittingCredentials
    },
    locked: {
      canEnterFromStates: { submittingCredentials: true },
      canLeaveToStates: { error: true },
      onEnter: this.handleEnterLocked
    },
    credentialsAccepted: {
      canEnterFromStates: { submittingCredentials: true },
      canLeaveToStates: { FSMTerminate: true }
    }
  };

  @Input() public prefillPassword: string = "";
  @Input() public prefillUsername: string = "";

  protected usernameControl = new FormControl<string>(this.prefillUsername, Validators.required);
  protected passwordControl = new FormControl<string>(this.prefillPassword, Validators.required);

  public loginForm: FormGroup<UserLoginFormGroup> = this.formBuilder.group({
    username: this.usernameControl,
    password: this.passwordControl
  });

  public constructor(
    private formBuilder: FormBuilder,
    private userAuthenticationService: UserAuthenticationService
  ) {
    super({ debugLogBufferCount: 10 });
  }

  public override ngAfterViewInit() {
    super.ngAfterViewInit();

    if (!this.fsmConfig.stateOverride) {
      this.changeState({
        state: "awaitingInput",
        password: this.prefillPassword,
        username: this.prefillUsername
      });
    }
  }

  protected handleEnterAwaitingInput(onEnterStateChanges: OnEnterStateChanges<UserLoginStates, "awaitingInput", UserLoginData, UserLoginCanLeaveToMap>): void {
    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData: enteringStateData } = enteringStateInfo;
    if (onEnterStateChanges.leavingStateInfo.state === "FSMInit") {
      this.setUsernameAndPassword(enteringStateData.username, enteringStateData.password);
    }
  }

  protected setUsernameAndPassword(username: string, password?: string): void {
    this.usernameControl.setValue(username);
    if (password) { this.passwordControl.setValue(password); };
  }


  protected handleEnterFrontendValidationCheck(onEnterStateChanges: OnEnterStateChanges<UserLoginStates, "frontendValidationCheck", UserLoginData, UserLoginCanLeaveToMap>): boolean | void {
    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData } = enteringStateInfo;

    if (this.loginForm.valid) {
      const formData: Partial<FormData> = this.loginForm.value;
      const username: string = formData.username?.toLowerCase() ?? "";

      if (username === "reject") { return false; }
      if (username === "error") { throw new Error("An example error was triggered"); }

      this.changeState({
        state: "submittingCredentials",
        username,
        password: formData.password?.toLowerCase() ?? "",
      });
    } else {
      this.changeState({
        state: "error",
        errorMessage: "login and password are required",
        password: stateData.password,
        username: stateData.password
      });
    }
  }

  protected handleEnterError(onEnterStateChanges: OnEnterStateChanges<UserLoginStates, "error", UserLoginData, UserLoginCanLeaveToMap>) {
    this.loginForm.enable();
    this.loginForm.valueChanges.pipe(
      take(1),
      takeUntil(this.destroy$),
      takeUntil(this.override$)
    ).subscribe(() => {
      const { enteringStateInfo } = onEnterStateChanges;
      const { stateData: enteringStateData } = enteringStateInfo;
      const { password, username } = enteringStateData;

      this.changeState({
        state: "awaitingInput",
        password,
        username
      });

    });
  }

  protected handleEnterSubmittingCredentials(onEnterStateChanges: OnEnterStateChanges<UserLoginStates, "submittingCredentials", UserLoginData, UserLoginCanLeaveToMap>) {

    if (this.loginForm.enabled) { this.loginForm.disable(); }
    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData: enteringStateData } = enteringStateInfo;
    const { password, username } = enteringStateData;
    const errorMessage = "Username or password not recognized";

    this.userAuthenticationService.authenticateUser(enteringStateData.username, enteringStateData.password).pipe(
      takeUntil(this.override$),
      takeUntil(this.destroy$)
    ).subscribe((authenticationResults: AuthenticationResults) => {
      switch (authenticationResults) {
        case "authorized":
          this.changeState({
            state: "credentialsAccepted",
            username,
          });
          break;
        case "rejected":
          this.changeState({
            state: "error",
            password,
            username,
            errorMessage
          });
          break;
        case "locked":
          this.changeState({
            state: "locked",
            errorMessage,
            password,
            username,
            lockedSecondsRemaining: 3
          });
          break;
        case "busy":
          console.log("busy");
          break;
        default:
          this.assertCannotReach(authenticationResults);
      }
    });
  }

  protected handleEnterLocked() {
    const countdown$: Subject<void> = new Subject();
    interval(1000).pipe(
      takeUntil(countdown$),
      takeUntil(this.destroy$),
      takeUntil(this.override$)
    ).subscribe(() => {
      this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<UserLoginStates, UserLoginData, UserLoginCanLeaveToMap>) => {
        if (currentStateInfo.state === "locked") {
          const { stateData: currentStateData } = currentStateInfo;
          const { errorMessage, password, username, lockedSecondsRemaining } = currentStateData;
          if (lockedSecondsRemaining > 1) {
            this.updateState({
              state: "locked",
              errorMessage,
              lockedSecondsRemaining: lockedSecondsRemaining - 1,
              username,
              password
            });
          } else {
            countdown$.next();
            countdown$.complete();
            this.changeState({
              state: "error",
              errorMessage,
              username,
              password
            });
          }
        }
      });
    });
  }

  protected override onUnknownError(e: Error, rejectData: StateTransition<UserLoginStates, UserLoginData>) {
    console.log(this.debugLog);
    console.log(e);
    console.log(rejectData);
    alert("Unknown Error thrown \nHere you could submit a bug report.");
  }

  protected override onTransitionRejected(transitionRejection: TransitionRejection) {
    console.log(this.debugLog);
    console.log(transitionRejection);
    alert("Transition Rejected \nHere you could submit a bug report if the rejection was unintended.");
  }

  public submitCredentials(): void {
    this.currentState$.subscribe((currentStateInfo: CurrentStateInfo<UserLoginStates, UserLoginData, UserLoginCanLeaveToMap>) => {
      if (currentStateInfo.state === "awaitingInput") {
        const { stateData: currentStateData } = currentStateInfo;
        this.changeState({
          ...currentStateData,
          state: "frontendValidationCheck",
        });
      }
    });

  }
}
