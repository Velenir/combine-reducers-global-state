# combine-reducers-global-state

A substitute for the default **combineReducers** function that comes with **redux**, aiming to solve the problem of cross-state access in local slice reducers. It passes `globalState` as the third argument to reducers, making it available along the local state slice.
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

const getAllIdsSelector = gState => Object.keys(gState);

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
      return getAllIdsSelector(globalState);
    //  remove all displayed items
    case 'REMOVE_ALL_ITEMS':
      return [];
    default:
      return state;
  }
};


const getItemByIdSelector = (gState, id) => gState.items[id];

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
        [id]: getItemByIdSelector(globalState, id)
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


const getEditingItemByIdSelector = (gState, id) => gState.editing[id];

// controls items stock
export const itemsReducer = (state = {}, action, globalState) => {
  switch (action.type) {
    // copies props of a newly edited item to the item in stock
    case 'SAVE_EDIT_ITEM':
    {
      const { id } = action.payload;
      return {
        ...state,
        [id]: { ...state[id], ...getEditingItemByIdSelector(globalState, id) }
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
