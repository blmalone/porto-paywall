import './App.css';
import { PurchaseButtonSelf } from './PurchaseButtonSelf';
import { PurchaseButtonDelegate, RevokePermissionsButton } from './PurchaseButtonDelegate';
import { Hooks } from 'porto/wagmi';
import { useAccount, useConnectors, useDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';
import { AccountDisplay } from './AccountDisplay';
import { SERVER_URL } from './constants';

interface UserSession {
  exp: string;
}

/**
 * Main application component that handles user authentication and displays payment options
 */
function App() {
  const MERCHANT_ADDRESS = '0x64574add22aa10ffff44f096a388bf1718896b8b';
  
  const { disconnect } = useDisconnect();
  const connect = Hooks.useConnect();
  const { address, isConnected } = useAccount();
  const [connector] = useConnectors();
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const handleConnect = async () => {
    connect.mutate({
      connector,
      signInWithEthereum: {
        authUrl: `${SERVER_URL}/siwe`,
      },
    });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  useEffect(() => {
    if (isConnected) {
      fetchUserSession();
    } else {
      setUserSession(null);
    }
  }, [isConnected]);

  const fetchUserSession = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/me`, { credentials: 'include' });
      const responseText = await response.text();
      const parsedData = JSON.parse(responseText);
      setUserSession(parsedData.user);
    } catch (error) {
      console.error('Error fetching user session:', error);
      setUserSession(null);
    }
  };

  const sessionExpiry = userSession?.exp 
    ? new Date(Number(userSession.exp) * 1000).toLocaleDateString() 
    : 'Unknown';

  return (
    <>
      {/* Brand Logo in top left */}
      <div className="brand-container">
        <div className="brand">
          <span className="emoji-logo">⛅</span>
          <h1 className="brand-title">Weather Foreseer</h1>
        </div>
      </div>

      {/* Power button in top right when connected */}
      {isConnected && (
        <div className="power-button-container">
          <button
            onClick={handleDisconnect}
            className="power-button connected"
            title="Disconnect"
          >
            ⏻
          </button>
        </div>
      )}

      <div className="main-content">
        <div className="header">
          <p><i>Get next year's weather forecast today!</i></p>
        </div>

        {!isConnected ? (
          <div className="card">
            <button
              onClick={handleConnect}
              disabled={connect.isPending}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: connect.isPending ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: connect.isPending ? 'not-allowed' : 'pointer',
                marginTop: '16px',
                minHeight: '40px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
                fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
              }}
            >
              {connect.isPending ? 'Connecting...' : 'Sign in With Ethereum'}
            </button>
          </div>
        ) : (
          <div>
            <div className="profile">
              <AccountDisplay
                userAddress={address!}
                serverAddress={MERCHANT_ADDRESS}
                sessionExpiry={sessionExpiry}
              />
            </div>
            <PurchaseButtonSelf />
            <hr />
            <PurchaseButtonDelegate />
            <RevokePermissionsButton />
          </div>
        )}
      </div>
    </>
  );
}

export default App;
