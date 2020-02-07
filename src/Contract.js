import React from 'react';

function Contract() {
  const [id, setId] = React.useState('');

  return (
    <div className="contract">
      <section>
        <label>
          <span>Token id</span>
          <input type="text" onChange={e => { setId(e.target.value); }} />
        </label>
      </section>
      {id !== '' ?
        <section>
          <h1>Data for {id}</h1>
        </section>
      :
        ''
      }
    </div>
  );
}

export default Contract;
