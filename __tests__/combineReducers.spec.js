/* @flow */

import combineReducers from '../src';
import type { GlobalState, Action, MappedReducers } from '../src';


const reverseStr: string => string = (str: string) => str.split('').reverse().join('');
const reducers: MappedReducers = {
  foo(state = 'foo', action) { return action.type === 'foo' ? reverseStr(state) : state; },
  bar(state = 'bar', action) { return action.type === 'bar' ? reverseStr(state) : state; },
  zed(state = '', action, globalState) {
    return action.type === 'zed' && globalState ? globalState.foo + globalState.bar : state;
  }
};

const createSpies: MappedReducers => MappedReducers = funcObject => Object.keys(funcObject)
  .reduce((acc, key) => {
    acc[key] = jest.spyOn(funcObject, key);
    return acc;
  }, {});


const inputState: GlobalState = {
  foo: 'foo',
  bar: 'bar',
  zed: '',
  other: 3
};

describe('combineReducers', () => {
  it('should take an object with functions for values and return a reducer', () => {
    const reducer = combineReducers(reducers);

    expect(reducer(inputState, {})).toBe(inputState);
  });

  it('should pass state, action and global state to each reducer including nested ones', () => {
    const allInputState: GlobalState = Object.assign({}, inputState, {
      nested: {
        a: 1,
        b: 2
      }
    });

    const nestedReducers: MappedReducers = {
      a(state = 0, action) { return action.type === 'a' ? state + 1 : state; },
      b(state = 0, action) { return action.type === 'b' ? state - 1 : state; }
    };

    // must bind functions to spies here, before they are copied inside combineReducers
    const nestedSpies = createSpies(nestedReducers);

    const allReducers: MappedReducers = Object.assign({}, reducers, {
      nested: combineReducers(nestedReducers)
    });

    const spies = createSpies(allReducers);

    const reducer = combineReducers(allReducers);
    const action: Action = { type: 'noop' };


    expect(reducer(allInputState, action)).toBe(allInputState);

    Object.keys(spies).forEach(key => {
      const spy = spies[key];

      expect(spy).toHaveBeenCalledWith(allInputState[key], action, allInputState);
      spy.mockReset();
      spy.mockRestore();
    });
    Object.keys(nestedSpies).forEach(key => {
      const spy = nestedSpies[key];

      expect(spy).toHaveBeenCalledWith(allInputState.nested[key], action, allInputState);
      spy.mockReset();
      spy.mockRestore();
    });
  });

  it('should apply reducers to their respective slices of state including nested ones', () => {
    const allInputState: GlobalState = Object.assign({}, inputState, {
      nested: {
        a: 1,
        b: 2
      }
    });

    const nestedReducers: MappedReducers = {
      a(state = 0, action) { return action.type === 'a' ? state + 1 : state; },
      b(state = 0, action) { return action.type === 'b' ? state - 1 : state; }
    };

    const allReducers = Object.assign({}, reducers, {
      nested: combineReducers(nestedReducers)
    });
    const reducer = combineReducers(allReducers);

    expect(reducer(allInputState, { type: 'foo' })).toEqual({
      foo: 'oof',
      bar: 'bar',
      zed: '',
      nested: {
        a: 1,
        b: 2
      }
    });
    expect(reducer(allInputState, { type: 'bar' })).toEqual({
      foo: 'foo',
      bar: 'rab',
      zed: '',
      nested: {
        a: 1,
        b: 2
      }
    });
    expect(reducer(allInputState, { type: 'a' })).toEqual({
      foo: 'foo',
      bar: 'bar',
      zed: '',
      nested: {
        a: 2,
        b: 2
      }
    });
    expect(reducer(allInputState, { type: 'b' })).toEqual({
      foo: 'foo',
      bar: 'bar',
      zed: '',
      nested: {
        a: 1,
        b: 1
      }
    });
    expect(reducer(allInputState, { type: 'noop' })).toEqual({
      foo: 'foo',
      bar: 'bar',
      zed: '',
      nested: {
        a: 1,
        b: 2
      },
      other: 3
    });
  });

  it('should make global state accessible to reducers', () => {
    const reducer = combineReducers(reducers);

    expect(reducer(inputState, { type: 'zed' })).toEqual({
      foo: 'foo',
      bar: 'bar',
      zed: 'foobar'
    });
  });

  it('should throw an error if passed an invalid reducer', () => {
    const invalidReducers: MappedReducers = Object.assign({}, reducers, {
      invalid() {}
    });

    expect(combineReducers(invalidReducers)).toThrowErrorMatchingSnapshot();
  });

  it('should ignore non-functions when combining reducers', () => {
    const withNonFunction = Object.assign({}, reducers,
      // @flow-disable
      { ar: [], obj: {}, str: '', num: 0, bool: true });

    const reducer = combineReducers(withNonFunction);

    expect(reducer(inputState, {})).toEqual(inputState);
  });
});
