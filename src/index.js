/* @flow */

function checkReducersValidity(reducers: MappedReducers): void {
  for (const key: string of Object.keys(reducers)) {
    const reducer = reducers[key];
    const type: string = '@@combine-reducers-global-state/RANDOM_ACTION_'
      + Math.random().toString(36).substring(7).split('').join('.');

    if (reducer(undefined, { type }) === undefined) {
      throw new Error(`Reducer "${key}" must return initial state when passed undefined state.`);
    }
  }
}

export type State = any
export type GlobalState = Object
export type Action = {+type?: string}

export type Reducer = (state: State, action: Action, globalState?: GlobalState) => State
export type MappedReducers = {[string]: Reducer}


export default function combineReducers(reducers: MappedReducers): Reducer {
  const finalReducers: MappedReducers = {};
  for (const key: string of Object.keys(reducers)) {
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  let error;
  try {
    checkReducersValidity(finalReducers);
  } catch (e) {
    error = e;
  }

  const finalReducerKeys: Array<string> = Object.keys(finalReducers);

  return function combination(
    state: State = {}, action: Action, globalState?: State = state
  ): State {
    if (error) throw error;

    let hasChanged: boolean = false;
    const nextState: State = {};
    for (const key: string of finalReducerKeys) {
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action, globalState);
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}
