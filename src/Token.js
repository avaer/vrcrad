import React from 'react';

function Token(props) {
  const [key, setKey] = React.useState('');
  const [value, setValue] = React.useState('');

  return (
    <div className="token">
      <section>
        <h1>Token {props.token}</h1>
        <form>
          <label>
            <span>Key</span>
            <input type="text" onChange={e => { setKey(e.target.value); }} />
          </label>
          <label>
            <span>Value</span>
            <input type="text" onChange={e => { setValue(e.target.value); }} />
          </label>
        </form>
      </section>
    </div>
  );
}

export default Token;
