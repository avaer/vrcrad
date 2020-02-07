import React from 'react';

function findTokenByKeyValue(key, value) {
  console.log('find token by key value', key, value);
}

function Secret() {
  const [id, setId] = React.useState(1);
  const [key, setKey] = React.useState('');
  const [value, setValue] = React.useState('');

  return (
    <div className="secret">
      <section>
        <h2>Go to token</h2>
        <form onSubmit={e => { e.preventDefault(); window.location.pathname = `/tokens/${id}`; }}>
          <label>
            <span>Token id</span>
            <input type="number" min="1" step="1" value={id} onChange={e => { setId(e.target.value); }} />
          </label>
          {(parseInt(id, 10) >= 1) ? <input type="submit" value="Go" /> : null}
        </form>
      </section>
      <section>
        <form onSubmit={e => { e.preventDefault(); findTokenByKeyValue(key, value); }}>
          <h2>Find token by metadata</h2>
          <label>
            <span>Key</span>
            <input type="text" value={key} onChange={e => { setKey(e.target.value); }} />
          </label>
          <label>
            <span>Value</span>
            <input type="text" value={value} onChange={e => { setValue(e.target.value); }} />
          </label>
          <input type="submit" value="Find token" />
        </form>
      </section>
      <h2>Actions</h2>
      <section>
        <form onSubmit={e => { e.preventDefault(); window.location.pathname = '/mint'; }}>
          <input type="submit" value="Mint new token" />
        </form>
      </section>
      <section>
        <form onSubmit={e => { e.preventDefault(); window.location.pathname = '/redeem'; }}>
          <input type="submit" value="Redeem code" />
        </form>
      </section>
    </div>
  );
}

export default Secret;
