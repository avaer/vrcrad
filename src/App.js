import React from 'react';
// import logo from './logo.svg';
import './App.css';
import {xrEnter} from './xr.js';

function App() {
  return <input type="button" value="Enter XR" onClick={() => xrEnter()} />
}

export default App;
