import React from 'react';

function redeem(signature) {
  console.log('redeem', signature);
}

function Redeem(props) {
  const [signature, setSignature] = React.useState('');

  return (
    <div className="redeem">
      <section>
        <h1>Signature to redeem</h1>
        <form onSubmit={e => { e.preventDefault(); redeem(signature); }}>
          <label>
            <span>Signature</span>
            <input type="text" value={signature} onChange={e => { setSignature(e.target.value); }} />
          </label>
          <input type="submit" value="Redeem" />
        </form>
      </section>
    </div>
  );
}

export default Redeem;
