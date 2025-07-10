import './App.css'
import { PurchaseButton } from './purchase-button'
import { DelegatePurchaseButton, RevokePermissionsButton } from './purchase-button-delegate'
import { Hooks } from 'porto/wagmi'
import { useAccount, useConnectors, useDisconnect } from 'wagmi'
import { useState, useEffect } from 'react'
import { AccountDisplay } from './AccountDisplay'
import { SERVER_URL } from './constants'

function App() {
  const MERCHANT_ADDRESS = '0x64574add22aa10ffff44f096a388bf1718896b8b';
  const disconnect = useDisconnect()
  const connect = Hooks.useConnect();
  const { address, isConnected } = useAccount();
  const [connector] = useConnectors()
  const [me, setMe] = useState<{ exp: string } | null>(null);
  SERVER_URL ? console.log("Communicating with server at: ", SERVER_URL) : console.log("Dev mode. Using localhost.");

  const handleConnect = async () => {
    connect.mutate({
      connector,
      signInWithEthereum: {
        authUrl: `${SERVER_URL}/siwe`,
        uri: SERVER_URL != '' ? SERVER_URL : undefined,
        domain: SERVER_URL != '' ? SERVER_URL : undefined,
      },
    })
  }

  useEffect(() => {
    if (isConnected) {
      fetch(`${SERVER_URL}/api/me`, { credentials: 'include' })
        .then((res) => res.text())
        .then((data) => {
          const parsedData = JSON.parse(data)
          setMe(parsedData.user)
        })
        .catch((error) => {
          console.error('Error fetching user data:', error)
          setMe(null)
        })
    } else {
      setMe(null)
    }
  }, [isConnected])

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
            onClick={() => {
              disconnect.disconnect();
            }}
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
                sessionExpiry={me?.exp ? new Date(Number(me.exp) * 1000).toLocaleDateString() : 'Unknown'}
              />
            </div>
            <PurchaseButton />
            <hr />
            <DelegatePurchaseButton />
            <RevokePermissionsButton />
          </div >
        )
        }
      </div>
    </>
  )
}

export default App
