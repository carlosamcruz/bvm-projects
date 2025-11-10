import { assert, expect, use } from 'chai'
import {
    bsv,
    DefaultProvider,
    findSig,
    hash160,
    Provider,
    PubKey,
    PubKeyHash,
    sha256,
    SignatureResponse,
    TestWallet,
    toByteString,
    toHex,
} from 'scrypt-ts'
import { Counter } from '../src/contracts/counter'
import { getDefaultSigner, sleep } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
import { before, describe, it } from 'node:test'
use(chaiAsPromised)

import * as dotenv from 'dotenv'
import { getTransaction } from '../src/services/mProviders'

// Load the .env file
dotenv.config()

if (!process.env.PRIVATE_KEY) {
    throw new Error(
        'No "PRIVATE_KEY" found in .env, Please run "npm run genprivkey" to generate a private key'
    )
}

//O valor do TXID do estado atual deve ser alterado manualmente em caso de os testes serem rodados de forma alternada
let currentState = "174576e95d17f430bb0e08e23599e529ba087ff7e4f397da92f03180c55fa328";
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
let provider = new DefaultProvider({ network: bsv.Networks.testnet })

describe('Test SmartContract `Counter`', () => {
    let instance: Counter

    let owner = PubKeyHash(
        toHex(bsv.Address.fromString(signer.addresses[0]).hashBuffer)
    )

    before(async () => {
        Counter.loadArtifact()

        console.log('Address: ', signer.addresses[0])
        console.log('Owner PHASH: ', owner)
    })

    //testes automatizados on chain são complexos;

    
    it('should deploy contract', async () => {
        instance = new Counter(owner, 3n)

        await instance.connect(signer2)

        const deployTx = await instance.deploy(1)

        currentState = deployTx.id

        console.log(`Deployed contract "Counter": ${currentState}`)

        assert.equal(deployTx.id.length, 64)
    })

/*
    
    it('should read current count.', async () => {
        await sleep(2) // espera para fazer uma nova requisição a woc
        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas
        let tx = new bsv.Transaction()
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet))

        let instance = Counter.fromTx(tx, 0)

        console.log('Value: ', instance.count)
        assert.equal(instance.count, 3n)
    })

    it('should NOT finalize the contract - Insufficient balance', async () => {
        await sleep(2) // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas
        let tx = new bsv.Transaction()
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet))

        let instance = Counter.fromTx(tx, 0)

        await instance.connect(signer)

        await sleep(2) // espera para fazer uma nova requisição a woc

        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)

        try {
            const { tx: callTx } = await instance.methods.finalize(
                (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey),
                PubKey(toHex(pbkey))
            )
            assert.equal(callTx.id.length, 64)

            // If we got here, the call didn't fail as expected
            // Não pode conter mensagem igual ao do erro
            assert.fail(
                'Expected transaction to be reverted due to wrong public key'
            )
        } catch (err: any) {
            expect(err.message).to.include('Insufficient balance')
        }
    })

    it('should increment count.', async () => {
        await sleep(2) // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas
        let tx = new bsv.Transaction()
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet))

        let instance = Counter.fromTx(tx, 0)

        await instance.connect(signer2)

        const nextInstance = instance.next()

        nextInstance.count = instance.count + 1n

        let value = 1001

        instance.bindTxBuilder('increment', async function () {
            const changeAddress = bsv.Address.fromString(signer2.addresses[0])

            const unsignedTx: bsv.Transaction =
                new bsv.Transaction().addInputFromPrevTx(tx, 0)

            unsignedTx
                .addOutput(
                    new bsv.Transaction.Output({
                        script: nextInstance.lockingScript,
                        satoshis: instance.balance + value,
                    })
                )
                .change(changeAddress)

            //console.log('Unsig TX Out: ', toHex(unsignedTx.outputs[0].script))
            return Promise.resolve({
                tx: unsignedTx,
                atInputIndex: 0,
                nexts: [],
            })
        })

        await sleep(2) // espera para fazer uma nova requisição a woc

        const { tx: callTx } = await instance.methods.increment(BigInt(value))

        currentState = callTx.id
        console.log('New State: ', currentState)
        assert.equal(callTx.id.length, 64)
    })   

    

    

    it('should decrement count.', async () => {
        await sleep(2) // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas
        let tx = new bsv.Transaction()
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet))

        let instance = Counter.fromTx(tx, 0)

        await instance.connect(signer)

        const nextInstance = instance.next()

        nextInstance.count = instance.count - 1n

        let value = 1000

        instance.bindTxBuilder('decrement', async function () {
            const changeAddress = bsv.Address.fromString(signer.addresses[0])

            const unsignedTx: bsv.Transaction =
                new bsv.Transaction().addInputFromPrevTx(tx, 0)

            unsignedTx
                .addOutput(
                    new bsv.Transaction.Output({
                        script: nextInstance.lockingScript,
                        satoshis: instance.balance + value,
                    })
                )
                .change(changeAddress)

            //console.log('Unsig TX Out: ', toHex(unsignedTx.outputs[0].script))
            return Promise.resolve({
                tx: unsignedTx,
                atInputIndex: 0,
                nexts: [],
            })
        })

        await sleep(2) // espera para fazer uma nova requisição a woc

        const { tx: callTx } = await instance.methods.decrement(BigInt(value))

        currentState = callTx.id
        console.log('New State: ', currentState)
        assert.equal(callTx.id.length, 64)
    })


    it('should finalize the contract', async () => {
        await sleep(2) // espera para fazer uma nova requisição a woc

        //let tx = await provider.getTransaction(currentState);

        //usar este getTransaction do myProviders pois o getTransaction do sCrypt não funciona para transações não confirmadas
        let tx = new bsv.Transaction()
        tx.fromString(await getTransaction(currentState, bsv.Networks.testnet))

        let instance = Counter.fromTx(tx, 0)

        await instance.connect(signer)

        await sleep(2) // espera para fazer uma nova requisição a woc

        let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)

        const { tx: callTx } = await instance.methods.finalize(
            (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey),
            PubKey(toHex(pbkey))
        )

        currentState = callTx.id
        console.log('Tx result: ', currentState)
        assert.equal(callTx.id.length, 64)
    })

    */   
    
    
})
