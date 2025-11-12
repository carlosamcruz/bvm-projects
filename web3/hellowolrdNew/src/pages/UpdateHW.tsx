import React, { useRef, FC, useState} from 'react';

import '../App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, PubKeyHash } from "scrypt-ts";
import { HelloworldNew } from "../contracts/HelloworldNew";

import { getTransaction } from '../services/mProviders';
import { homenetwork, homepvtKey } from './InsertKey';


let Alice: TestWallet


function UpdateHW() {

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

        console.log("Current State: ", value.current.value)

        let tx = new bsv.Transaction(await getTransaction(value.current.value, homenetwork));

        //let tx = await provider.getTransaction(value.current.value)

        let instance = HelloworldNew.fromTx(tx, 0)

        await instance.connect(signer);

        const nextInstance = instance.next();

        console.log("New text 0: ", toByteString(Buffer.from(msg.current.value, 'utf8').toString('hex')));

        nextInstance.msg = toByteString(Buffer.from(msg.current.value, 'utf8').toString('hex'));

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

           
        //const deployTx = new bsv.Transaction(await instance.deploy(value.current.value));

        console.log('Helloworld contract deployed: ', callTx.id)
     
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
      }
    }
  };

  return (
    <div className="App">
        <header className="App-header">
    
        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
          Update Contract
        
        </h2>

        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>        
                  <label style={{ fontSize: '14px', paddingBottom: '0px' }}
                    >Inform Current State TXID and Message to Update:  
                  </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={value} type="hex" name="PVTKEY1" min="1" placeholder="txid" />
                </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={msg} type="text" name="PVTKEY1" min="1" placeholder="message" />
                </label>     
        </div>

        <button className="insert" onClick={deploy}
                style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '5px'}}
        >Update</button>
                              
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

export default UpdateHW;
