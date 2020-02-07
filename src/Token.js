import React from 'react';
const {QRCode} = window;

function makeTokenImgSrc(token) {
  // console.log('get qr code', QRCode);
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
  // console.log('got img 1', c, s);
  // const imgSrc = qrRender.querySelector('img').src;
  qrRender.innerHTML = '';
  return s;
}
function getMetadata(key) {
  console.log('get metadata', key);
}
function setMetadata(key, value) {
  console.log('set metadata', key, value);
}

let tokenImgSrc = null;
function Token(props) {
  const [readKey, setReadKey] = React.useState('');
  const [writeKey, setWriteKey] = React.useState('');
  const [writeValue, setWriteValue] = React.useState('');

  if (!tokenImgSrc) {
    tokenImgSrc = makeTokenImgSrc(props.token);
    // console.log('got img src', tokenImgSrc);
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
