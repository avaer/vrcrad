import React from 'react';
import contract from './contract.js';
import {makePromise} from './util.js';
const {QRCode} = window;

function makeImgSrc(text) {
  const qrRender = document.getElementById('qr-render');
  var qrcode = new QRCode(qrRender, {
    text,
    width: 300,
    height: 300,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
  const c = qrRender.querySelector('canvas');
  const s = c.toDataURL();
  qrRender.innerHTML = '';
  return s;
}
async function fetchTokenBalance(id) {
  const p = makePromise();
  const instance = await contract.getInstance();
  instance.balanceOf(contract.account, id, (err, balance) => {
    if (!err) {
      p.accept(balance.toNumber());
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function fetchTokenJson(id) {
  const p = makePromise();
  const instance = await contract.getInstance();
  instance.getMetadataKeys(id, (err, keys) => {
    if (!err) {
      const o = {};
      Promise.all(keys.map(key => {
        const p = makePromise();
        instance.getMetadata(id, key, (err, value) => {
          if (!err) {
            o[key] = value;
            p.accept();
          } else {
            p.reject(err);
          }
        });
        return p;
      })).then(() => {
        p.accept(o);
      });
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function generateSignature(id) {
  const s = 'Gunt' + id;
  const p = makePromise();
  window.web3.personal.sign(s, contract.account, (err, signature) => {
    if (!err) {
      p.accept(signature);
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function getMetadata(id, key) {
  // id = parseInt(id, 10);
  console.log('get metadata', [id, key]);
  const p = makePromise();
  const instance = await contract.getInstance();
  instance.getMetadata(id, key, (err, value) => {
    if (!err) {
      p.accept(value);
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function setMetadata(id, key, value) {
  // id = parseInt(id, 10);
  console.log('set metadata', [id, key, value]);
  const p = makePromise();
  const instance = await contract.getInstance();
  instance.setMetadata(id, key, value, (err, result) => {
    if (!err) {
      p.accept();
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function setMetadataFromSignature(id, key, value, signature) {
  // id = parseInt(id, 10);
  console.log('set metadata from signature', [id, key, value, signature]);
  const p = makePromise();
  const instance = await contract.getInstance();
  instance.setMetadataFromSignature(id, key, value, signature, (err, result) => {
    if (!err) {
      p.accept();
    } else {
      p.reject(err);
    }
  });
  return await p;
}

function Token(props) {
  const [tokenImgSrc, setTokenImgSrc] = React.useState('');
  const [tokenJsonFetched, setTokenJsonFetched] = React.useState(false);
  const [tokenBalance, setTokenBalance] = React.useState(null);
  const [tokenJson, setTokenJson] = React.useState(null);
  const [signature, setSignature] = React.useState('');
  const [signatureImgSrc, setSignatureImgSrc] = React.useState('');
  const [readKey, setReadKey] = React.useState('');
  const [readValue, setReadValue] = React.useState('');
  const [writeKey, setWriteKey] = React.useState('');
  const [writeValue, setWriteValue] = React.useState('');
  const [signatureValue, setSignatureValue] = React.useState('');

  if (!tokenImgSrc) {
    setTokenImgSrc(makeImgSrc(`https://gunt.one/tokens/${props.token}`));
  }
  if (!tokenJsonFetched) {
    setTokenJsonFetched(true);
    fetchTokenBalance(props.token).then(setTokenBalance);
    fetchTokenJson(props.token).then(setTokenJson);
  }
  if (signature && !signatureImgSrc) {
    setSignatureImgSrc(makeImgSrc(signature));
  }

  return (
    <div className="token">
      <section>
        <h1>Token {props.token}</h1>
        {tokenImgSrc ? <img src={tokenImgSrc} /> : null}
        <h2>Balance: {tokenBalance}</h2>
        {tokenBalance > 0 ? <form onSubmit={e => { e.preventDefault(); generateSignature(props.token).then(setSignature).catch(console.warn); }}>
          <h2>Generate signature</h2>
          <input type="submit" value="Generate" />
          <pre>{signature}</pre>
          {signatureImgSrc ? <img src={signatureImgSrc} /> : null}
        </form> : null}
        <form onSubmit={e => { e.preventDefault(); getMetadata(props.token, readKey).then(setReadValue).catch(console.warn); }}>
          <h2>Get metadata</h2>
          <label>
            <span>Key</span>
            <input type="text" value={readKey} onChange={e => { setReadKey(e.target.value); }} />
          </label>
          <input type="submit" value="Get value" />
          <div>{readValue}</div>
        </form>
        <form onSubmit={e => {
          e.preventDefault();
          if (signatureValue) {
            setMetadataFromSignature(props.token, writeKey, writeValue, signatureValue).catch(console.warn);
          } else {
            setMetadata(props.token, writeKey, writeValue).catch(console.warn);
          }
        }}>
          <h2>Set metadata</h2>
          <label>
            <span>Key</span>
            <input type="text" value={writeKey} onChange={e => { setWriteKey(e.target.value); }} />
          </label>
          <label>
            <span>Value</span>
            <input type="text" value={writeValue} onChange={e => { setWriteValue(e.target.value); }} />
          </label>
          <label>
            <span>Signature to use (optional)</span>
            <input type="text" value={signatureValue} onChange={e => { setSignatureValue(e.target.value); }} />
          </label>
          <input type="submit" value="Set value" />
        </form>
      </section>
    </div>
  );
}

export default Token;
