import React, { useRef, FC, useState} from 'react';

import '../App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, PubKeyHash } from "scrypt-ts";
import { HelloworldNew } from "../contracts/HelloworldNew";
import { homenetwork, homepvtKey } from './InsertKey';


let Alice: TestWallet


function HomeDeploy() {

  const [deployedtxid, setdeptxid] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  let txlink2 = ""
  const msg = useRef<any>(null);
  const value = useRef<any>(null);

  const deploy = async (amount: any) => {

    //Para evitar o problema:  Should connect to a livenet provider
    //Bypassar o provider externo e const
    let provider = new DefaultProvider({network: homenetwork});

    if(homepvtKey.length != 64 || value.current.value < 2)
    {
      alert('No PVT Key or Wrong Data!!!')
    }
    else
    {
      setdeptxid("Wait!!!")

      //let privateKey = bsv.PrivateKey.fromHex(homepvtKey, bsv.Networks.testnet)
      let privateKey = bsv.PrivateKey.fromHex(homepvtKey, homenetwork)

      Alice = new TestWallet(privateKey, provider)

      //Linha necessária nesta versão
      //O signee deve ser connectado
      //await Alice.connect(provider)

      try {

        const signer = Alice

      //Linha necessária nesta versão
      //O signee deve ser connectado
      await signer.connect(provider)

        const message = toByteString(msg.current.value, true)

        let owner = PubKeyHash(toHex(bsv.Address.fromString(signer.addresses[0]).hashBuffer))

        const instance = new HelloworldNew(owner)
        
        await instance.connect(signer);
            
        const deployTx = new bsv.Transaction(await instance.deploy(value.current.value));

        console.log('Helloworld contract deployed: ', deployTx.id)
     
        if(homenetwork === bsv.Networks.mainnet )
        {
          txlink2 = "https://whatsonchain.com/tx/" + deployTx.id;
        }
        else if (homenetwork === bsv.Networks.testnet )
        {
          txlink2 = "https://test.whatsonchain.com/tx/" + deployTx.id;
        }
        setLinkUrl(txlink2);
  
        setdeptxid(deployTx.id)

      } catch (e) {
        console.error('deploy HelloWorld failes', e)
        alert('deploy HelloWorld failes')
      }
    }
  };

  return (
    <div className="App">
        <header className="App-header">
    
        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
          Deploy Hello World
        
        </h2>

        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>        
                  <label style={{ fontSize: '14px', paddingBottom: '0px' }}
                    >Inform the Number of Satoshis 
                  </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={value} type="number" name="PVTKEY1" min="1" placeholder="satoshis (min 2 sat)" />
                </label>     
        </div>

        <button className="insert" onClick={deploy}
                style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '5px'}}
        >Deploy</button>
                              
        {
            deployedtxid.length === 64?
            
            <div>
              <div className="label-container" style={{ fontSize: '12px', paddingBottom: '0px', paddingTop: '20px' }}>
                <p className="responsive-label" style={{ fontSize: '12px' }}>TXID: {deployedtxid} </p>
              </div>
              <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '0px' }}>
                <p className="responsive-label" style={{ fontSize: '12px' }}>TX link: {' '} 
                    <a href={linkUrl} target="_blank" style={{ fontSize: '12px', color: 'cyan'}}>
                    {linkUrl}</a></p>
              </div>
            </div>  
            
            :

            <div className="label-container" style={{ fontSize: '12px', paddingBottom: '20px', paddingTop: '20px' }}>
              <p className="responsive-label" style={{ fontSize: '12px' }}>{deployedtxid} </p>
            </div>
        }

      </header>
    </div>
  );
}

export default HomeDeploy;
