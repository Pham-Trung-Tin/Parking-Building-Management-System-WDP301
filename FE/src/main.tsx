import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { SocketProvider } from './contexts/SocketContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    // <React.StrictMode>
    <SocketProvider>
      <App />
    </SocketProvider>
    //</React.StrictMode>
);
