import { assert, expect, use } from 'chai'
import { bsv, DefaultProvider, hash160, MethodCallOptions, Provider, PubKeyHash, sha256, TestWallet, toByteString, toHex } from 'scrypt-ts'
import { Helloworld } from '../src/contracts/helloworld'
import { getDefaultSigner, sleep } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
import { before, describe, it } from 'node:test'
import { getTransaction } from '../src/services/mProviders'

//import { state } from './utils/state'
//import { rpcCall } from './utils/rpc'
use(chaiAsPromised)

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

if(!process.env.PRIVATE_KEY) {
    throw new Error("No \"PRIVATE_KEY\" found in .env, Please run \"npm run genprivkey\" to generate a private key")
}

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

let statetx = "08c7f7ed606c0da0b9bb93dc4730456193a92e0f9965e4158db495f9e87367b9"

let provider = new DefaultProvider({network: bsv.Networks.testnet});


describe('Test SmartContract `Helloworld`', () => {
    //let instance: Helloworld

    Helloworld.loadArtifact();

    //let pubKey = bsv.PublicKey.fromPrivateKey(privateKey)

    //let owner = PubKeyHash(toHex(bsv.Address.fromString(getDefaultSigner().addresses[0]).hashBuffer));

    let owner = PubKeyHash(toHex(bsv.Address.fromString(signer.addresses[0]).hashBuffer));


    //testes automatizados on chain são complexos;
    
    it('should read current message.', async () => {
        //const deployTx = await instance.deploy(100)
        console.log(`Deployed contract "Helloworld": ${statetx}`)

        //console.log("Current state: ", state.current);

        //state.current = statetx;

        //await sleep(10);
        //let tx = await provider.getTransaction(deployTx.id);
        //let tx = await provider.getTransaction(statetx);

        let transaction = await getTransaction(statetx, bsv.Networks.testnet);

        //console.log("TX: ", transaction)

        let tx = new bsv.Transaction;

        tx.fromString(transaction);

        let instance = Helloworld.fromTx(tx, 0)


        //console.log("new state: ", state.current);

        console.log("Value: ", Buffer.from(instance.msg, 'hex').toString('utf8') )
        //assert.equal(instance.msg, Buffer.from("Hello Bitcoin", 'utf8').toString('hex'));

    })


    /*
    it('should change message.', async () => {

        let tx = await provider.getTransaction(statetx);

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        const nextInstance = instance.next();

        console.log("New text 0: ", toByteString(Buffer.from("New Message", 'utf8').toString('hex')));

        nextInstance.msg = toByteString(Buffer.from("New Message", 'utf8').toString('hex'));

        //nextInstance.update(toByteString(Buffer.from("New Message", 'utf8').toString('hex')));

        console.log("New text 1: ", nextInstance.msg);


        instance.bindTxBuilder('update', async function () {

            const changeAddress = bsv.Address.fromString(signer.addresses[0])
   
            const unsignedTx: bsv.Transaction = new bsv.Transaction()
            .addInputFromPrevTx(tx, 0)

            unsignedTx.addOutput(new bsv.Transaction.Output({
                script: nextInstance.lockingScript,
                satoshis: instance.balance,
            }))
            .change(changeAddress)

            //console.log('Unsig TX Out: ', toHex(unsignedTx.outputs[0].script))
            return Promise.resolve({
                tx: unsignedTx,
                atInputIndex: 0,
                nexts: [
                ]
            });              
        });

        const { tx: callTx } = await instance.methods.update(nextInstance.msg);

        console.log("New State: ", callTx.id )
        assert.equal(callTx.id.length, 64);

    })   

    */

})

