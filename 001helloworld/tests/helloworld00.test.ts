import { assert, expect, use } from 'chai'
import { bsv, DefaultProvider, findSig, hash160, Provider, PubKey, PubKeyHash, sha256, SignatureResponse, TestWallet, toByteString, toHex } from 'scrypt-ts'
import { Helloworld } from '../src/contracts/helloworld'
import { getDefaultSigner, sleep } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
import { before, describe, it } from 'node:test'
use(chaiAsPromised)

import * as dotenv from 'dotenv'
import { getTransaction } from '../src/services/mProviders'

// Load the .env file
dotenv.config()

if(!process.env.PRIVATE_KEY) {
    throw new Error("No \"PRIVATE_KEY\" found in .env, Please run \"npm run genprivkey\" to generate a private key")
}

//O valor do TXID do estado atual deve ser alterado manualmente em caso de os testes serem rodados de forma alternada
let currentState = "a7f60fd7f8cf0e858c91b3de526ef5aa705dcbe5424917da0b30c6eeb4bb7442";

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')
const privateKey2 = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY2 || '')


// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

//Para teste de falha de assinatura
const signer2 = new TestWallet(
    privateKey2,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

//Usaremos myProvider para fazer os testes, pois o provedor do sCrypt está desatualizado para transações não confirmadas
let provider = new DefaultProvider({network: bsv.Networks.testnet});


describe('Test SmartContract `Helloworld`', () => {
    let instance: Helloworld

    let owner = PubKeyHash(toHex(bsv.Address.fromString(signer.addresses[0]).hashBuffer));

    before(async () => {
        Helloworld.loadArtifact();

        console.log("Address: ", signer.addresses[0]);
        console.log("Owner PHASH: ", owner);
    })

    //testes automatizados on chain são complexos;
    
    it('should deploy contract', async () => {
        instance = new Helloworld(owner)

        await instance.connect(signer)
        
        const deployTx = await instance.deploy(100)

        currentState = deployTx.id;

        console.log(`Deployed contract "Helloworld": ${currentState}`);

        assert.equal(deployTx.id.length, 64);
    })    

    it('should read current message.', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc
        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        console.log("Value: ", Buffer.from(instance.msg, 'hex').toString('utf8') )
        assert.equal(instance.msg, Buffer.from("Hello Bitcoin", 'utf8').toString('hex'));
    })

    it('should update message.', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        const nextInstance = instance.next();

        nextInstance.msg = toByteString(Buffer.from("New Message", 'utf8').toString('hex'));

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

        await sleep(2); // espera para fazer uma nova requisição a woc

        const { tx: callTx } = await instance.methods.update(nextInstance.msg);

        currentState = callTx.id;
        console.log("New State: ", currentState )
        assert.equal(callTx.id.length, 64);
    })
       
    //Muito cuidado neste teste
    it('should NOT update message - hashOutputs mismatch', async () => {
        
        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        const nextInstance = instance.next();

        //Não repetir a mensagem anterior
        //nextInstance.msg = toByteString(Buffer.from("New Message", 'utf8').toString('hex'));
        nextInstance.msg = toByteString(Buffer.from("To Fail Message", 'utf8').toString('hex'));

        instance.bindTxBuilder('update', async function () {

            const changeAddress = bsv.Address.fromString(signer.addresses[0])
   
            const unsignedTx: bsv.Transaction = new bsv.Transaction()
            .addInputFromPrevTx(tx, 0)

            unsignedTx.addOutput(new bsv.Transaction.Output({
                script: instance.lockingScript,//nextInstance.lockingScript - produces output mismatch
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

        await sleep(2); // espera para fazer uma nova requisição a woc

        try {
            const { tx: callTx } = await instance.methods.update(nextInstance.msg);

            assert.equal(callTx.id.length, 64);
  
            // If we got here, the call didn't fail as expected
            // Não pode conter mensagem igual ao do erro
            assert.fail("Expected transaction to be reverted due to HashOutputs Mismatch");
          } catch (err: any) {

            expect(err.message).to.include("hashOutputs mismatch");
          }
    })   

    it('should NOT finalize the contract - wrong message', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        await sleep(2); // espera para fazer uma nova requisição a woc

        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)


        try {
            const { tx: callTx } = await instance.methods.finalize(
                (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey))
            );
            assert.equal(callTx.id.length, 64);
  
            // If we got here, the call didn't fail as expected
            // Não pode conter mensagem igual ao do erro
            assert.fail("Expected transaction to be reverted due to wrong message");
        } catch (err: any) {

            expect(err.message).to.include("msg must be finalize");
        }        

    })   

    it('should update message - finalize', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        const nextInstance = instance.next();

        nextInstance.msg = toByteString(Buffer.from("finalize", 'utf8').toString('hex'));

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

        await sleep(2); // espera para fazer uma nova requisição a woc

        const { tx: callTx } = await instance.methods.update(nextInstance.msg);

        currentState = callTx.id;
        console.log("New State: ", currentState )
        assert.equal(callTx.id.length, 64);
    })   
    
    it('should read current message - finalize', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc
        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        console.log("Value: ", Buffer.from(instance.msg, 'hex').toString('utf8') )
        assert.equal(instance.msg, Buffer.from("finalize", 'utf8').toString('hex'));
    })

    it('should NOT finalize the contract - wrong public key', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        await sleep(2); // espera para fazer uma nova requisição a woc

        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey);
        let pbkey2 = bsv.PublicKey.fromPrivateKey(privateKey2);

        try {
            const { tx: callTx } = await instance.methods.finalize(
                (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey2))
            );
            assert.equal(callTx.id.length, 64);
  
            // If we got here, the call didn't fail as expected
            // Não pode conter mensagem igual ao do erro
            assert.fail("Expected transaction to be reverted due to wrong public key");
        } catch (err: any) {

            expect(err.message).to.include("Bad public key");
        }        
    })   

    it('should NOT finalize the contract - checkSig failed', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)
 
        //mudar para o segundo signeer para testar assinatura errada
        //o endereço a ser utilizado precisa ser utxo suficiente para poder gerar a assinatura
        await instance.connect(signer2);
 
        await sleep(2); // espera para fazer uma nova requisição a woc

        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey);
        let pbkey2 = bsv.PublicKey.fromPrivateKey(privateKey2);

        try {
            const { tx: callTx } = await instance.methods.finalize(
                (sigResps: SignatureResponse[]) => {
                    //console.log("sig resp: ", sigResps)
                    findSig(sigResps, pbkey2)
                }, 
                PubKey(toHex(pbkey))
            );
            assert.equal(callTx.id.length, 64);
  
            // If we got here, the call didn't fail as expected
            // Não pode conter mensagem igual ao do erro
            assert.fail("Expected transaction to be reverted due to failed sigcheck");
        } catch (err: any) {

            expect(err.message).to.include("checkSig failed, pubkey");
        }        
    })   

    it('should finalize the contract', async () => {

        await sleep(2); // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas        
        let tx = new bsv.Transaction;
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet));

        let instance = Helloworld.fromTx(tx, 0)

        await instance.connect(signer);

        await sleep(2); // espera para fazer uma nova requisição a woc

        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)

        const { tx: callTx } = await instance.methods.finalize(
            (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey))
        );

        currentState = callTx.id;
        console.log("Tx result: ", currentState )
        assert.equal(callTx.id.length, 64);
    })           
})
