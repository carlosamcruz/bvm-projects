import React, { useRef, useState } from 'react';
import './App.css';

import HomeDeply from "./pages/HomeDeploy"
import Finalize from './pages/Finalize';
import UpdateHW from './pages/UpdateHW';
import ReadData from './pages/ReadData';
import InsertKey from './pages/InsertKey';


function App() {

  const [currentPage, setCurrentPage] = useState<string>('deploy');
  const [showHomeDropdown, setShowHomeDropdown] = useState<boolean>(false);
  
  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setShowHomeDropdown(false);  
  }

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

                    <button className="dropdown-button" onClick={() => handlePageChange('key')}>
                      PvtKey
                    </button>

                    <button className="dropdown-button" onClick={() => handlePageChange('deploy')}>
                      Deploy
                    </button>

                    <button className="dropdown-button" onClick={() => handlePageChange('read')}>
                      Read
                    </button>

                     <button className="dropdown-button" onClick={() => handlePageChange('update')}>
                      Update
                    </button>

                    <button className="dropdown-button" onClick={() => handlePageChange('interact')}>
                      Finalize
                    </button>

                  </div>

                )}
              </div>
      </nav>          
      {currentPage === 'key' && <InsertKey/>}
      {currentPage === 'deploy' && <HomeDeply/>}
      {currentPage === 'read' && <ReadData/>}
      {currentPage === 'interact' && <Finalize/>}
      {currentPage === 'update' && <UpdateHW/>}
 
    </div>
  );
}

export default App;