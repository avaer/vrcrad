import React from 'react';
// import logo from './logo.svg';
import './App.css';
import {xrEnter} from './xr.js';

function App() {
  return (
    <div>
      <header>
        <img src="logo.svg" alt="logo" height={70} width={70} />
      </header>
      <input type="button" value="Enter XR" onClick={() => xrEnter()} />
    </div>
  );
}

export default App;
