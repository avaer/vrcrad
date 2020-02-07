import React from 'react';
import logo from './logo.svg';
import './App.css';
import Tokens from './Tokens.js';
import Token from './Token.js';
import Mint from './Mint.js';

function App() {
  let match;
  if (/^\/tokens$/.test(window.location.pathname)) {
    return (
      <Tokens />
    );
  } else if (match = window.location.pathname.match(/^\/tokens\/([0-9]+)$/)) {
    return (
      <Token token={match[1]} />
    );
  } else if (/^\/mint$/.test(window.location.pathname)) {
    return (
      <Mint />
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
