import React from 'react';

function mintToken(id) {
  console.log('mint token', id);
}

function Mint(props) {
  const [id, setId] = React.useState(1);

  return (
    <div className="mint">
      <section>
        <form onSubmit={e => { e.preventDefault(); mintToken(id); }}>
          <label>
            <span>Token id to mint</span>
            <input type="number" min="1" step="1" onChange={e => { setId(e.target.value); }} />
          </label>
        </form>
      </section>
    </div>
  );
}

export default Mint;
