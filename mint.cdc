import('https://flow.webaverse.com/flow.js').then(async m => {

var {makeCredentials, executeTransaction} = m;

var p = pe.children[0];
console.log('fetch 1', `http://contracts.exokit.org:3001/${p.hash}`);
var {address: contractAddress, keys: contractKeys} = await fetch(`http://contracts.exokit.org:3001/${p.hash}`)
  .then(res => res.json());
console.log('fetch 2', `http://contracts.exokit.org:3001/${p.hash}/${pe.getEnv('username')}`);
var {address: userAddress, keys: userKeys} = await fetch(`http://contracts.exokit.org:3001/${p.hash}/${pe.getEnv('username')}`)
  .then(res => res.json());
var credentials = makeCredentials(contractAddress, contractKeys.privateKey);
var amount = 100;

return await executeTransaction(credentials, `\
    // Transaction3.cdc

    import FungibleToken from 0x${contractAddress}

    // This transaction mints tokens and deposits them into account 2's vault
    transaction {

        // Local variable for storing the reference to the minter resource
        let mintingRef: &FungibleToken.VaultMinter

        // Local variable for storing the reference to the Vault of
        // the account that will receive the newly minted tokens
        var receiverRef: &FungibleToken.Vault{FungibleToken.Receiver}

        prepare(acct: AuthAccount) {
            // Borrow a reference to the stored, private minter resource
            self.mintingRef = acct.borrow<&FungibleToken.VaultMinter>(from: /storage/MainMinter)!
            
            // Get the public account object for account
            let recipient = getAccount(0x${userAddress})

            // Get their public receiver capability
            let capability2 = recipient.getCapability(/public/MainReceiver)!

            // Borrow a reference from the capability
            self.receiverRef = capability2.borrow<&FungibleToken.Vault{FungibleToken.Receiver}>()!
        }

        execute {
            // Mint 30 tokens and deposit them into the recipient's Vault
            self.mintingRef.mintTokens(amount: ${amount.toFixed(1)}, recipient: self.receiverRef)
        }
    }
`);

}).then(console.log);