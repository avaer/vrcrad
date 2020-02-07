import React from 'react';

function Tokens() {
  const [id, setId] = React.useState(1);

  return (
    <div className="tokens">
      <section>
        <form onSubmit={e => { e.preventDefault(); window.location.pathname = `/tokens/${id}`; }}>
          <label>
            <span>Token id</span>
            <input type="number" min="1" step="1" value={id} onChange={e => { setId(e.target.value); }} />
          </label>
          {(parseInt(id, 10) >= 1) ? <input type="submit" value={`Go to token ${id}`} /> : null}
        </form>
      </section>
      <section>
        <form onSubmit={e => { e.preventDefault(); window.location.pathname = '/mint'; }}>
          <input type="submit" value="Mint new token" />
        </form>
      </section>
    </div>
  );
}

export default Tokens;
