import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

import { Helloworld } from './contracts/helloworld';
import { HelloworldNew } from './contracts/HelloworldNew';
import artifact from './artifacts/helloworld.json';
import artifact2 from './artifacts/HelloworldNew.json';
Helloworld.loadArtifact(artifact);

HelloworldNew.loadArtifact(artifact2);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

