
/*eslint-disable*/
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RunHelpers, TestScheduler } from 'rxjs/testing';
import { TrafficLightSimpleComponent } from './traffic-light-simple.component';

describe('TrafficLightSimpleComponent', () => {

  let component: TrafficLightSimpleComponent;
  let fixture: ComponentFixture<TrafficLightSimpleComponent>;
  let testScheduler: TestScheduler;

  beforeEach(() => {

    TestBed.configureTestingModule({
      declarations: [TrafficLightSimpleComponent]
    });

    fixture = TestBed.createComponent(TrafficLightSimpleComponent);
    component = fixture.componentInstance;

    testScheduler = new TestScheduler((actual, expected) => {
      //console.log("actual", actual);
      //console.log("expected", expected);
      expect(actual).toEqual(expected);
    });
  });

  fit('should cycle between the go, prepareToStop and stop states', () => {

    testScheduler.schedule(() => { fixture.detectChanges(); }, 1);
    testScheduler.schedule(() => { fixture.destroy(); }, 20002);

    testScheduler.run((runHelpers: RunHelpers) => {
      const { expectObservable } = runHelpers;
      expectObservable(component.stateData$).toBe('a b 6999ms c 2999ms d 9999ms e |', {
        a: { state: "FSMInit" },
        b: { state: 'go', trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } },
        c: { state: 'prepareToStop', trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } },
        d: { state: 'stop', trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } },
        e: { state: 'go', trafficLightTimings: { go: 7000, prepareToStop: 3000, stop: 10000 } },
      });
    });
  });
});