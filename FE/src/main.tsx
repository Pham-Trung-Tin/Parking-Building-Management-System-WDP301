import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { SocketProvider } from './contexts/SocketContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-default.apps.googleusercontent.com'; // Fallback so it doesn't crash if env is missing


ReactDOM.createRoot(document.getElementById('root')).render(
    // <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <SocketProvider>
        <App />
      </SocketProvider>
    </GoogleOAuthProvider>
    //</React.StrictMode>
);
