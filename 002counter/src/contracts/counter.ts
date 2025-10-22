import {
    assert,
    ByteString,
    hash160,
    hash256,
    method,
    prop,
    PubKey,
    PubKeyHash,
    Sig,
    SmartContract,
    toByteString,
} from 'scrypt-ts'

export class Counter extends SmartContract {
    @prop()
    readonly owner: PubKeyHash

    // Stateful property to store counters value.
    @prop(true)
    count: bigint

    constructor(owner: PubKeyHash, count: bigint) {
        super(...arguments)
        this.owner = owner
        this.count = count
    }

    @method()
    public increment(value: bigint) {
        assert(value >= 1000n, 'interection fee must be >= 1000000n')
        this.incrementThis()

        // banlance will increase 0.01 Bitcoins = 1000000 satoshis
        const amount: bigint = this.ctx.utxo.value + value
        // output containing the latest state
        let outputs: ByteString = this.buildStateOutput(amount)

        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }

        // verify current tx has this single output
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    public decrement(value: bigint) {
        assert(value >= 1000n, 'interection fee must be >= 1000000n')
        this.decrementThis()

        // banlance will increase 0.01 Bitcoins = 1000000 satoshis
        const amount: bigint = this.ctx.utxo.value + value
        // output containing the latest state
        let outputs: ByteString = this.buildStateOutput(amount)

        if (this.changeAmount > 0n) {
            outputs += this.buildChangeOutput()
        }

        // verify current tx has this single output
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    public finalize(sig: Sig, pubkey: PubKey) {
        assert(this.ctx.utxo.value >= 1000n, 'Insufficient balance')

        assert(hash160(pubkey) == this.owner, 'Bad public key')
        assert(
            this.checkSig(sig, pubkey),
            `checkSig failed, pubkey: ${this.owner}`
        )

        assert(this.count >= 3, 'Contrat Not Old Enough')
    }

    @method()
    incrementThis(): void {
        this.count++
    }

    @method()
    decrementThis(): void {
        this.count--
    }
}
