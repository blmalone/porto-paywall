import './App.css'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ReproduceWebAuthnSignatureIssue } from './bug'

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
      <h1>Minimal Reproduction of WebAuthn Signature Issue</h1>
      
      {!isConnected ? (
        <div className="card">
          <h2>Connect Your Wallet</h2>
          <p>Please connect your Porto wallet to test the WebAuthn signature issue.</p>
          <button 
            onClick={handleConnect}
            disabled={isPending}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isPending ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isPending ? 'not-allowed' : 'pointer',
              marginTop: '16px'
            }}
          >
            {isPending ? 'Connecting...' : 'Connect Porto Wallet'}
          </button>
        </div>
      ) : (
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f0f8ff',
            borderRadius: '8px'
          }}>
            <div>
              <strong>Connected:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <button 
              onClick={() => disconnect()}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Disconnect
            </button>
          </div>
          <ReproduceWebAuthnSignatureIssue />
        </div>
      )}
    </>
  )
}

export default App
