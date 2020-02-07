import React from 'react';
import contract from './contract.js';

const _makePromise = () => {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
};

async function mintToken(id, count) {
  const p = _makePromise();
  contract.instance.mint(id, contract.account, count, (err, result) => {
    if (!err) {
      p.accept(result);
    } else {
      p.reject(err);
    }
  });
  return await p;
}

function Mint(props) {
  const [id, setId] = React.useState(0);
  const [count, setCount] = React.useState(1);

  return (
    <div className="mint">
      <section>
        <form onSubmit={e => { e.preventDefault(); mintToken(id, count).catch(console.warn); }}>
          <label>
            <span>Token id to mint</span>
            <input type="number" value="0" min="0" step="1" onChange={e => { setId(e.target.value); }} />
            <span>Count</span>
            <input type="number" value={count} min="1" step="1" onChange={e => { setCount(e.target.value); }} />
            <input type="submit" value="Mint token" />
          </label>
        </form>
      </section>
    </div>
  );
}

export default Mint;
