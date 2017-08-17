[![Build Status](https://travis-ci.org/Velenir/combine-reducers-global-state.svg?branch=master)](https://travis-ci.org/Velenir/combine-reducers-global-state) [![npm version](https://badge.fury.io/js/combine-reducers-global-state.svg)](https://badge.fury.io/js/combine-reducers-global-state) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![dependencies Status](https://david-dm.org/velenir/combine-reducers-global-state/status.svg)](https://david-dm.org/velenir/combine-reducers-global-state) [![devDependencies](https://david-dm.org/velenir/combine-reducers-global-state/dev-status.svg)](https://david-dm.org/velenir/combine-reducers-global-state?type=dev) [![Greenkeeper badge](https://badges.greenkeeper.io/Velenir/combine-reducers-global-state.svg)](https://greenkeeper.io/) [![codecov](https://codecov.io/gh/Velenir/combine-reducers-global-state/branch/master/graph/badge.svg)](https://codecov.io/gh/Velenir/combine-reducers-global-state) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/velenir/combine-reducers-global-state/blob/master/LICENSE)

# combine-reducers-global-state

A substitute for the default **combineReducers** function that comes with **redux**, aiming to solve the problem of cross-state access in local slice reducers. This **combineReducers** implementation passes `globalState` as the third argument to reducers, making it available along with the local state slice.

 `globalState` here is the whole top-level state returned from `store.getState()` before it is sliced inside the `combineReducer`.

## Usage

For example, given a store state at some point:

```js
// example of a working state
{
 // a mapped stock of items
 items: {
   uid1: {
     id: 'uid1',
     name: 'item1'
     // ...
   },
   uid2: {
     id: 'uid2',
     name: 'item2'
     // ...
   },
   uid3: {
     id: 'uid3',
     name: 'item3'
     // ...
   }
 },
 // items on display
 display: ['uid2', 'uid3'],
 // currently editing
 editing: {
   uid1: {
     id: 'uid1',
     name: 'renamed_item1'
     // ...
   }
 }
}
```

Reducers that make use of global state may look like this:

```js
// reducers.js

// selector that returns all item ids
const getAllIds = gState => Object.keys(gState);

// controls which items are currently on display
export const displayReducer = (state = [], action, globalState) => {
  switch (action.type) {
    //  add another item
    case 'ADD_ITEM':
      return [...state, action.payload.id];
    //  remove an item
    case 'REMOVE_ITEM':
      return state.filter(id => id !== action.payload.id);
    //  add all available itemsReducer
    case 'ADD_ALL_ITEMS':
      return getAllIds(globalState);
    //  remove all displayed items
    case 'REMOVE_ALL_ITEMS':
      return [];
    default:
      return state;
  }
};


// selector that returns one item with given id
const getItemById = (gState, id) => gState.items[id];

// edits properties of an individual item
export const editingReducer = (state = {}, action, globalState) => {
  switch (action.type) {
    //  grabs current state of an item
    // and adds it to the editing list
    case 'START_EDIT_ITEM':
    //  or just overwrites its state
    case 'RESET_EDIT_ITEM':
    {
      const { id } = action.payload;
      return {
        ...state,
        [id]: getItemById(globalState, id)
      };
    }
    // changes properties of an item inside the editing list
    case 'EDIT_ITEM':
    {
      const { id, ...props } = action.payload;
      return {
        ...state,
        [id]: { ...state[id], ...props }
      };
    }
    //  removes an item from the editing list
    case 'SAVE_EDIT_ITEM':
    case 'CANCEL_EDIT_ITEM':
      return { ...state, [action.payload.id]: undefined };
    default:
      return state;
  }
};


// selector that returns an item being edited with given id
const getEditingItemById = (gState, id) => gState.editing[id];

// controls items stock
export const itemsReducer = (state = {}, action, globalState) => {
  switch (action.type) {
    // copies props of a newly edited item to the item in stock
    case 'SAVE_EDIT_ITEM':
    {
      const { id } = action.payload;
      return {
        ...state,
        [id]: { ...state[id], ...getEditingItemById(globalState, id) }
      };
    }
    default:
      return state;
  }
};

```

> If your selectors make time consuming calculations, it is recommended to use memoization, for example with the help of a third-party library such as [reselect](https://github.com/reactjs/reselect).

Finally, `combineReducer` makes `globalState` available to all reducers passed to it:

```js
import { createStore } from 'redux';
import combineReducers from 'combine-reducers-global-state';
import * as reducers from './reducers';

const reducer = combineReducers(reducers);

const store = createStore(reducer);

...
```
