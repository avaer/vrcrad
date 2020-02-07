import React from 'react';
import logo from './logo.svg';
import './App.css';
import Contract from './Contract.js';

function App() {
  if (/\/contract/.test(window.location.pathname)) {
    return (
      <Contract/>
    );
  } else {
    return (
      <pre>has been deployed: an easter egg<br/>
it comes to those who do not beg<br/>
its in a place that could be worse<br/>
so start the hunt inside the verse<br/></pre>
    );
  }
}

export default App;
