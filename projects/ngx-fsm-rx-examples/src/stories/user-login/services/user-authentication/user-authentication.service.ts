/*eslint-disable*/

import { Injectable } from '@angular/core';
import { BaseStateData, CurrentStateInfo, OnEnterStateChanges, StateMap } from 'fsm-rx';
import mermaid from 'mermaid';
import { FsmRxInjectable } from 'ngx-fsm-rx';
import { Observable, Subject, delay, take } from 'rxjs';

type PaddingValues = {
  paddingLeft: number,
  paddingBottom: number;
};

type AuthenticationStates = "ready" | "verifying";

export type AuthenticationResults = "authorized" | "rejected" | "locked" | "busy";

interface BaseAuthenticationData extends BaseStateData<AuthenticationStates> {
  loginAttempts: number;
}

interface AuthenticationReadyData extends BaseAuthenticationData {
  state: "ready";
}

interface AuthenticationVerifyingData extends BaseAuthenticationData {
  state: "verifying";
  username: string;
  password: string;
}

type AuthenticationData = AuthenticationReadyData | AuthenticationVerifyingData;

type AuthenticationCanLeaveToMap = {
  FSMInit: "ready",
  ready: "verifying",
  verifying: "ready";
};

@Injectable({
  providedIn: 'root'
})
export class UserAuthenticationService extends FsmRxInjectable<AuthenticationStates, AuthenticationData, AuthenticationCanLeaveToMap> {

  protected override stateMap: StateMap<AuthenticationStates, AuthenticationData, AuthenticationCanLeaveToMap> = {
    ready: {
      canEnterFromStates: { FSMInit: true, verifying: true },
      canLeaveToStates: { verifying: true }
    },
    verifying: {
      canEnterFromStates: { ready: true },
      canLeaveToStates: { ready: true },
      onEnter: this.handleEnterVerifying
    }
  };


  private _authentication$: Subject<AuthenticationResults> = new Subject();

  private get authentication$(): Observable<AuthenticationResults> {
    return this._authentication$.pipe(
      take(1),
      delay(2000)
    );
  }

  constructor() {
    super({ stateDiagramDirection: "LR" });
    if (this.isInDevMode) {
      this.renderDiagram(this.getStateDiagramDefinition());
    }
    this.changeState({
      state: 'ready',
      loginAttempts: 3
    });

  }

  private async renderDiagram(stateDiagramDefinition: string) {
    const { svg } = await mermaid.render('user-authentication-diagram', stateDiagramDefinition);
    const paddingValues = this.extractPaddingValues(svg);
    this.printSvg(svg, "User Authentication Service", paddingValues);
  }

  private extractPaddingValues(svg: string): PaddingValues {
    let paddingValues: PaddingValues = {
      paddingBottom: 100,
      paddingLeft: 100
    };

    const viewBoxRegex = /viewBox="([^"]+)"/;
    const match: RegExpMatchArray | null = svg.match(viewBoxRegex);

    if (match) {
      const viewBoxArray: number[] = match[1].split(" ").map(Number);
      if (viewBoxArray.length === 4) {
        paddingValues.paddingLeft = viewBoxArray[2];
        paddingValues.paddingBottom = viewBoxArray[3];
      }
    }
    return paddingValues;
  }

  private printSvg(svg: string, title: string, paddingValues: PaddingValues) {
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    console.log('\n\n' + title + ':\n %c ', `
    background-image: url(${svgDataUrl});
    padding-bottom: ${paddingValues.paddingBottom}px;
    padding-left: ${paddingValues.paddingLeft}px;
    background-size: contain;
    background-position: center center;
    background-repeat: no-repeat;
  `);
  }

  public authenticateUser(username: string, password: string): Observable<AuthenticationResults> {

    this.currentState$.pipe(
      delay(0)
    ).subscribe((currentStateInfo: CurrentStateInfo<AuthenticationStates, AuthenticationData, AuthenticationCanLeaveToMap>) => {
      if (currentStateInfo.state === "ready") {
        const { stateData } = currentStateInfo;
        this.changeState({
          state: "verifying",
          loginAttempts: stateData.loginAttempts,
          username,
          password
        });
      } else {
        this._authentication$.next("busy");
      }
    });
    return this.authentication$;
  };

  private handleEnterVerifying(onEnterStateChanges: OnEnterStateChanges<AuthenticationStates, "verifying", AuthenticationData, AuthenticationCanLeaveToMap>) {

    const { enteringStateInfo } = onEnterStateChanges;
    const { stateData: enteringStateData } = enteringStateInfo;
    let { loginAttempts } = enteringStateData;

    if (enteringStateData.username === "admin" && enteringStateData.password === "12345") {
      this._authentication$.next("authorized");
    } else {
      loginAttempts--;
      if (loginAttempts === 0) {
        this._authentication$.next("locked");
        loginAttempts = 3;
      } else {
        this._authentication$.next("rejected");
      }
    }

    this.changeState({
      state: "ready",
      loginAttempts
    });

  }

}
