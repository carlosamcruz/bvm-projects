import React, { useRef, FC, useState} from 'react';

import '../App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString, PubKeyHash } from "scrypt-ts";
import { HelloworldNew } from "../contracts/HelloworldNew";


//export let homepvtKey = "3c2ffdbb0a57c0cff0deacba15a92bf1d218dda9a9c7c668dd0640a6204b6394";
export let homepvtKey = "";
export let homenetwork = bsv.Networks.testnet

let Alice: TestWallet


function InsertKey() {

  const [deployedtxid, setdeptxid] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  let txlink2 = ""
  const msg = useRef<any>(null);
  const value = useRef<any>(null);

  const deploy = async (amount: any) => {

    if( msg.current.value.length !== 64)
    {
      alert('No PVT Key or Wrong Data!!!')
    }
    else
    {
      setdeptxid("Done!!!")

      homepvtKey = msg.current.value;

    }
  };

  return (
    <div className="App">
        <header className="App-header">
    
        <h2 style={{ fontSize: '34px', paddingBottom: '5px', paddingTop: '5px'}}>

          <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
          Insert Key
        
        </h2>

        <div style={{ textAlign: 'center', paddingBottom: '20px' }}>        
                  <label style={{ fontSize: '14px', paddingBottom: '0px' }}
                    >Insert Hex Key:  
                  </label>     
        </div>

        <div style={{ display: 'inline-block', textAlign: 'center', paddingBottom: '20px' }}>
            <label style={{ fontSize: '14px', paddingBottom: '0px' }}  
                > 
                    <input ref={msg} type="hex" name="PVTKEY1" min="1" placeholder="hex pvt key" />
                </label>     
        </div>

        <button className="insert" onClick={deploy}
                style={{ fontSize: '14px', paddingBottom: '2px', marginLeft: '5px'}}
        >Insert</button>
                              
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

export default InsertKey;
