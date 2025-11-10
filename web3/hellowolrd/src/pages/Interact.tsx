import React, { useRef, FC, useState} from 'react';

import '../App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString } from "scrypt-ts";
import { Helloworld } from "../contracts/helloworld";

import {homepvtKey, homenetwork} from './HomeDeploy';

let Alice: TestWallet

function Interact() {

  const [deployedtxid, setdeptxid] = useState("");
  const labelRef = useRef<HTMLLabelElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  let txlink2 = ""
  const msg = useRef<any>(null);

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

      
      //const message = toByteString('hello world', true)
      const message = toByteString(msg.current.value, true)
      let tx = new bsv.Transaction
      tx = await provider.getTransaction(txid.current.value)
  
      console.log('Current State TXID: ', tx.id)

      const instance = Helloworld.fromTx(tx, 0) 
      await instance.connect(signer)
  
      const { tx: callTx } = await instance.methods.unlock(message)
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
          On Chain Hello World - Melt
          
        </h2>


        <div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
                
                <label style={{ fontSize: '14px', paddingBottom: '2px' }}
                  >Inform the Contract Message and TXID then press Unlock:  
                </label>     
          </div>

          <div style={{ textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={msg} type="text" name="PVTKEY1" min="1" placeholder="message" />
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
                >Unlock</button>

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

export default Interact;
