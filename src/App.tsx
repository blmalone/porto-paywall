import './App.css'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { PurchaseButton } from './purchase-button'
import { DelegatePurchaseButton } from './purchase-button-delegate'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const handleConnect = () => {
    const portoConnector = connectors.find(connector => connector.name === 'Porto')
    if (portoConnector) {
      connect({ connector: portoConnector })
    }
  }

  return (
    <>
      <h1>⛅ Weather Foreseer 🌧️</h1>
      <p><i>Get next year's weather forecast today.</i></p>

      {!isConnected ? (
        <div className="card">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your Porto wallet to test the WebAuthn signature issue.</p>
          <button 
            onClick={handleConnect}
            disabled={isPending}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: isPending ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              marginTop: '16px',
              minHeight: '40px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif'
            }}
          >
            {isPending ? 'Connecting...' : 'Connect Porto Wallet'}
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="connection-header">
            <div className="connection-info">
              <strong>Connected:</strong> <a href={`https://sepolia.basescan.org/address/${address}`} target="_blank" rel="noopener noreferrer">{address?.slice(0, 6)}...{address?.slice(-4)}</a>
            </div>
            <button 
              onClick={() => disconnect()}
              className="disconnect-button"
            >
              Disconnect
            </button>
          </div>
          <PurchaseButton />
          <hr />
          <DelegatePurchaseButton />
        </div>
      )}
    </>
  )
}

export default App
