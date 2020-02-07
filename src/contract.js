import address from './address.js';
import abi from './abi.js';

const contract = {
  instance: null,
  async init() {
    if (window.ethereum) {
      window.web3 = new window.Web3(window.ethereum);
      try {
        // Request account access if needed
        await window.ethereum.enable();
        // Acccounts now exposed
        // web3.eth.sendTransaction({/* ... */});

        this.instance = window.web3.eth.contract(abi).at(address);
      } catch (err) {
        // User denied account access...
        console.warn(err);
      }
    } else {
      console.warn('no ethereum!');
    }
  },
};
window.contract = contract;
export default contract;