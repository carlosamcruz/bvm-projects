import React, { useRef, FC, useState} from 'react';

import '../App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, SignatureResponse, findSig } from "scrypt-ts";
import { HelloworldNew } from "../contracts/HelloworldNew";

import {homepvtKey, homenetwork} from './InsertKey';
import { getTransaction } from '../services/mProviders';

let Alice: TestWallet

function Finalize() {

  const [deployedtxid, setdeptxid] = useState("");
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  let txlink2 = ""
  
  const interact = async (amount: any) => {
    setdeptxid("Wait!!!")

    //Para evitar o problema:  Should connect to a livenet provider
    //Bypassar o provider externo e const
    let provider = new DefaultProvider({network: homenetwork});

    let privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork) 

    Alice = new TestWallet(privateKey, provider)

    try {

      const signer = Alice

      //Linha necessária nesta versão
      //O signee deve ser connectado
      await signer.connect(provider)

      let tx = new bsv.Transaction(await getTransaction(txid.current.value, homenetwork));
  
      console.log('Current State TXID: ', tx.id)

      const instance = HelloworldNew.fromTx(tx, 0) 

      await instance.connect(signer)

      let pbkey = bsv.PublicKey.fromPrivateKey(privateKey)
      
              const { tx: callTx } = await instance.methods.finalize(
                  (sigResps: SignatureResponse[]) => findSig(sigResps, pbkey), PubKey(toHex(pbkey))
              );
  
      //const { tx: callTx } = await instance.methods.unlock(message)
      console.log('Helloworld contract `unlock` called: ', callTx.id)
      //alert('unlock: ' + callTx.id)
              
      if(homenetwork === bsv.Networks.mainnet )
      {
        txlink2 = "https://whatsonchain.com/tx/" + callTx.id;
      }
      else if (homenetwork === bsv.Networks.testnet )
      {
        txlink2 = "https://test.whatsonchain.com/tx/" + callTx.id;
      }
      setLinkUrl(txlink2);

      setdeptxid(callTx.id)


  
    } catch (e) {
      console.error('deploy HelloWorld failes', e)
      alert('deploy HelloWorld failes')
      setdeptxid("Try Again!!!")
    }
  };

  const txid = useRef<any>(null);

  return (
    <div className="App">
        <header className="App-header">

        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>   
          Finalize Contract
          
        </h2>


        <div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                
                <label style={{ fontSize: '14px', paddingBottom: '2px' }}
                  >Inform Currente State TXID with message "finalize":  
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '5px' }}  
                > 
                    <input ref={txid} type="hex" name="PVTKEY1" min="1" placeholder="txid" />
                </label>     
            </div>
            <div style={{ textAlign: 'center', paddingBottom: '10px' }}>
                
                <button className="insert" onClick={interact}
                    style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '0px'}}
                >Finalize</button>

            </div>
        </div>

        {
            deployedtxid.length === 64?
            
            /* <button onClick={handleCopyClick}>Copy to ClipBoard</button> */

            <div>
            <div className="label-container" style={{ fontSize: '12px', paddingBottom: '0px', paddingTop: '0px' }}>
                <p className="responsive-label" style={{ fontSize: '12px' }}>TXID: {deployedtxid} </p>
            </div>
            <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
                <p className="responsive-label" style={{ fontSize: '12px' }}>TX link: {' '} 
                    <a href={linkUrl} target="_blank" style={{ fontSize: '12px', color: 'cyan'}}>
                    {linkUrl}</a></p>
            </div>
            </div>
               
            :

            <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
            <p className="responsive-label" style={{ fontSize: '12px' }}>{deployedtxid} </p>
            </div>
        }

      </header>
    </div>
  );
}

export default Finalize;
