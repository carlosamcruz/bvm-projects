import {
    assert,
    ByteString,
    hash160,
    hash256,
    method,
    prop,
    PubKey,
    PubKeyHash,
    sha256,
    Sha256,
    Sig,
    SmartContract,
    toByteString,
} from 'scrypt-ts'

export class Helloworld extends SmartContract {
    
    @prop()
    readonly owner: PubKeyHash;
    @prop(true)
    msg: ByteString

    constructor(owner: PubKeyHash) {
        super(...arguments)
        this.owner = owner;
        //Hello Bitcoin == 48656c6c6f20426974636f696e
        this.msg = toByteString("48656c6c6f20426974636f696e"); 
    }

    @method() //stateful
    public update(message: ByteString) {

        this.msg = message;

        const amount: bigint = this.ctx.utxo.value
        // output containing the latest state
        let outputs: ByteString = this.buildStateOutput(amount)

        if(this.changeAmount > 0n) {
            outputs += this.buildChangeOutput();
        }
         
        // verify current tx has this single output
        assert(this.ctx.hashOutputs == hash256(outputs), 'hashOutputs mismatch')
    }

    @method()
    public finalize(sig: Sig, pubkey: PubKey) {

        assert(hash160(pubkey) == this.owner, "Bad public key")
        assert(this.checkSig(sig, pubkey), `checkSig failed, pubkey: ${this.owner}`);
        
        //finalize == 66696e616c697a65
        assert(this.msg == toByteString("66696e616c697a65"), 'msg must be finalize')
    }
}
