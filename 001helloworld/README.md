# 🔐 Helloworld Smart Contract – sCrypt

This project demonstrates a simple smart contract written in [sCrypt](https://scrypt.io/) for the Bitcoin SV (BSV) blockchain using the UTXO model. The contract allows storing and updating a message on-chain, and optionally finalizing the contract with signature-based authorization.

## 📜 Contract Description

The `Helloworld` contract is a **stateful** smart contract. It maintains a state variable `msg` that can be updated and later finalized. It includes two main public methods:

### ✅ `update(message: ByteString)`

This method updates the `msg` field on-chain. It is stateful and requires:

* The same satoshi amount to be carried forward.
* Output hash verification using `hashOutputs`.

If there's any change output, it is included automatically.

### 🔒 `finalize(sig: Sig, pubkey: PubKey)`

This method finalizes the contract if:

* The provided signature is valid.
* The public key hash matches the contract’s `owner`.
* The current message equals `"finalize"` (hex: `66696e616c697a65`).

Once finalized, the contract terminates without producing any further stateful output.

---

## 🧪 Setup & Testing Instructions

Before running the test, follow these steps:

---

## 🧪 Setup & Testing Instructions

Before running the test, follow these steps:

### 0️⃣ Clone the project and install dependencies

```bash
git clone <your-repo-url>
cd 001helloworld
```

### 1️⃣ Create and fund two private keys

* Copy `.env.example` to `.env`:

  ```bash
  cp .env.example .env
  ```

* Replace the WIF keys in `.env` with two valid private keys.

* Create keys at [websvmenu -> new pvtkey -> convert to WIF ](https://carlosamcruz.github.io/websvmenu/).

* Fund both addresses using the [scrypt.io testnet faucet](https://scrypt.io/faucet).

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Compile the contract

```bash
npx scrypt-cli@latest compile
```

### 4️⃣ Run the tests

```bash
npm run test:one -- ./tests/helloworld00.test.ts
```

---

## 📌 Technical Notes

* The message `"Hello Bitcoin"` is pre-set in the constructor as: `48656c6c6f20426974636f696e` (hex).
* The contract can only be finalized when `msg == "finalize"` in hex.
* Finalization ensures the contract's state is terminated securely.

---

## 📖 References

* [sCrypt Docs](https://docs.scrypt.io/)
* [scrypt-ts API](https://scrypt.io/docs/scrypt-ts/)
* [Bitcoin SV](https://bitcoinsv.com/)
* [Testnet Faucet](https://scrypt.io/faucet)