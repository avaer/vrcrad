import React from 'react';
import contract from './contract.js';
import {makePromise} from './util.js';
const {QRCode} = window;

function makeTokenImgSrc(token) {
  const qrRender = document.getElementById('qr-render');
  var qrcode = new QRCode(qrRender, {
    text: `https://gunt.one/tokens/${token}`,
    width: 128,
    height: 128,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
  const c = qrRender.querySelector('canvas');
  const s = c.toDataURL();
  qrRender.innerHTML = '';
  return s;
}
async function fetchTokenJson() {
  const p = makePromise();
  contract.instance.mint(id, contract.account, count, (err, result) => {
    if (!err) {
      p.accept(result);
    } else {
      p.reject(err);
    }
  });
  return await p;
}
function getMetadata(key) {
  console.log('get metadata', key);
}
function setMetadata(key, value) {
  console.log('set metadata', key, value);
}

function Token(props) {
  const [tokenImgSrc, setTokenImgSrc] = React.useState('');
  const [tokenJsonFetched, setTokenJsonFetched] = React.useState(false);
  const [tokenJson, setTokenJson] = React.useState(null);
  const [readKey, setReadKey] = React.useState('');
  const [writeKey, setWriteKey] = React.useState('');
  const [writeValue, setWriteValue] = React.useState('');

  if (!tokenImgSrc) {
    setTokenImgSrc(makeTokenImgSrc(props.token));
  }
  if (!tokenJsonFetched) {
    setTokenJsonFetched(true);
    fetchTokenJson().then(setTokenJson);
  }

  return (
    <div className="token">
      <section>
        <h1>Token {props.token}</h1>
        <img src={tokenImgSrc} />
        <form onSubmit={e => { e.preventDefault(); getMetadata(readKey); }}>
          <h2>Get metadata</h2>
          <label>
            <span>Key</span>
            <input type="text" value={readKey} onChange={e => { setReadKey(e.target.value); }} />
          </label>
          <input type="submit" value="Get value" />
        </form>
        <form onSubmit={e => { e.preventDefault(); setMetadata(writeKey, writeValue); }}>
          <h2>Set metadata</h2>
          <label>
            <span>Key</span>
            <input type="text" value={writeKey} onChange={e => { setWriteKey(e.target.value); }} />
          </label>
          <label>
            <span>Value</span>
            <input type="text" value={writeValue} onChange={e => { setWriteValue(e.target.value); }} />
          </label>
          <input type="submit" value="Set value" />
        </form>
      </section>
    </div>
  );
}

export default Token;
