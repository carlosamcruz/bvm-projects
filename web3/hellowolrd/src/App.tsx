import React, { useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';

import { DefaultProvider, sha256, toHex, PubKey, bsv, TestWallet, Tx, toByteString } from "scrypt-ts";
import { Helloworld } from "./contracts/helloworld";
import HomeDeply from "./pages/HomeDeploy"
import Interact from './pages/Interact';

const provider = new DefaultProvider({network: bsv.Networks.testnet});
let Alice: TestWallet
let signerExt: TestWallet
const privateKey = bsv.PrivateKey.fromHex("3c2ffdbb0a57c0cff0deacba15a92bf1d218dda9a9c7c668dd0640a6204b6394", bsv.Networks.testnet)   

function App() {

  const [currentPage, setCurrentPage] = useState<string>('deploy');

  const [showHomeDropdown, setShowHomeDropdown] = useState<boolean>(false);
  const [showIntDropdown, setShowIntDropdown] = useState<boolean>(false);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowHomeDropdown(false);  
    setShowIntDropdown(false);
  }

  const txid = useRef<any>(null);

  return (
    <div className="App">

      <nav className="navbar">
              <div className="dropdown">
                <button className="button" 
                    onClick={() => {setShowHomeDropdown(!showHomeDropdown);}}>
                  Home
                </button>
                {showHomeDropdown && (
                  <div className="dropdown-content">

                    <button className="dropdown-button" onClick={() => handlePageChange('deploy')}>
                      Deploy
                    </button>

                    <button className="dropdown-button" onClick={() => handlePageChange('interact')}>
                      Interact
                    </button>

                  </div>

                )}
              </div>
      </nav>          
      {currentPage === 'deploy' && <HomeDeply/>}

      {currentPage === 'interact' && <Interact/>}
 
    </div>
  );
}

export default App;