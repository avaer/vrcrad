import React from 'react';

function getMetadata(key) {
  console.log('get metadata', key);
}
function setMetadata(key, value) {
  console.log('set metadata', key, value);
}

function Token(props) {
  const [readKey, setReadKey] = React.useState('');
  const [writeKey, setWriteKey] = React.useState('');
  const [writeValue, setWriteValue] = React.useState('');

  return (
    <div className="token">
      <section>
        <h1>Token {props.token}</h1>
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
