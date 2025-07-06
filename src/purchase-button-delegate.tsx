import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { waitForCallsStatus } from 'viem/actions';
import { baseSepolia } from 'wagmi/chains';
import { SequenceDiagram } from './SequenceDiagram';
import { hashTypedData } from 'viem';

const DelegateSequenceDiagram: React.FC = () => {
  const diagramDefinition = `
    sequenceDiagram
      participant User
      participant Server
      
      User->>Server: Request Paywalled Content (1 click)
      Server->>User: Returns: Status Code: 402, Content Price, Receipt/Merchant Server Address, Token Address
      User->>User: Grants Permissions to Merchant Server Address (2 clicks)
      User->>User: Signs Challenge (2 clicks)
      User->>User: No-op onchain transaction to force preCalls from wallet_grantPermissions onchain (2 clicks)
      User->>Server: Sends challenge response
      Server->>Server: Verifies challenge response and attempts to execute payment with the keys belonging to the Merchant Server Address
      Server->>User: Returns: Status Code: 200, Paywalled Content
      User->>User: Displays Content
  `;

  return (
    <SequenceDiagram 
      title="Merchant Server Pulling Payment" 
      diagramDefinition={diagramDefinition}
      idPrefix="delegate"
    />
  );
};

export const DelegatePurchaseButton: React.FC = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const handleDelegatePurchase = async () => {
    setIsProcessing(true);
    setIsSuccess(false);
    setSuccessData(null);

    try {
      const step1 = await fetch(`/api/weather`, {
        headers: {
          'X-USER-ADDRESS': address as `0x${string}`
        }
      });
      console.log(step1);
      if (step1.ok) {
        const data = await step1.json();
        console.log(data);
        setIsSuccess(true);
        setSuccessData(data);
      } else if (step1.status === 402) {
        const data = await step1.json();
        console.log(data);
        const token = data.accepts.asset;
        const serverAddress = data.accepts.payTo;
        const limit = `0x${BigInt(data.accepts.maxAmountRequired).toString(16)}`;
        const challenge = data.accepts.challenge;
        
        // Create proper EIP-712 typed data for server challenge
        const serverChallenge = {
          domain: {
            name: 'Weather Clairvoyant',
            version: '1',
            chainId: baseSepolia.id,
            verifyingContract: serverAddress as `0x${string}`
          },
          primaryType: 'ServerChallenge',
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' }
            ],
            ServerChallenge: [
              { name: 'challenge', type: 'string' },
              { name: 'user', type: 'address' },
              { name: 'timestamp', type: 'uint256' },
              { name: 'purpose', type: 'string' }
            ]
          },
          message: {
            challenge: challenge,
            user: address as `0x${string}`,
            timestamp: Math.floor(Date.now() / 1000),
            purpose: 'Authorize weather forecast payment delegation'
          }
        };
        console.log("This is the server challenge", serverChallenge);
        
        const permissions = await (walletClient as any).request({
          method: 'wallet_grantPermissions',
          params: [{
            expiry: Math.floor(Date.now() / 1_000) + 24 * 60 * 60, // 1 day
            key: {
              publicKey: serverAddress,
              type: "secp256k1"
            },
            permissions: { 
              calls: [{ 
                signature: 'transfer(address,uint256)', 
                to: token 
              }], 
              spend: [{ 
                limit,
                period: 'day', 
                token: token,
              }] 
            }
          }]
        });
        console.log(permissions);

        console.log("This is the server challenge", challenge);
        const challengeHash = hashTypedData(serverChallenge as any);
        console.log("This is the challenge hash", challengeHash);
        const signature = await (walletClient as any).request({ 
          method: 'eth_signTypedData_v4', 
          params: [address as `0x${string}`, JSON.stringify(serverChallenge)], 
        }) as `0x${string}`
        console.log("Signature: ", signature);

        // No-op to force preCalls from wallet_grantPermissions onchain.
        const { id } = await (walletClient as any).request({  
          method: 'wallet_sendCalls',  
          params: [{ calls: [] }] // Empty calls array  
        })
        
        const status = await waitForCallsStatus(walletClient as any, {
          id,
          timeout: 20_000,
        });
        console.log("Waiting for calls status: ", status);
        
        const step2 = await fetch(`/api/weather`, {
          headers: {
            'X-PAYMENT': signature as `0x${string}`,
            'X-USER-ADDRESS': address as `0x${string}`
          }
        });
        console.log(step2);
        const step2Data = await step2.json();
        console.log(step2Data);
        if (step2.ok) {
          setIsSuccess(true);
          setSuccessData(step2Data);
        } else {
          throw new Error('Failed to fetch premium data: Status ' + step2.status + ' ' + step2.statusText);
        }
      } else {
        throw new Error('Failed to fetch premium data: Status ' + step1.status + ' ' + step1.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="component-container">
      <div className="button-group">
        <button
          onClick={handleDelegatePurchase}
          disabled={isProcessing || !address}
          className="primary-button"
        >
          {isProcessing ? 'Processing...' : 'Delegate Purchase'}
        </button>

        {isSuccess && (
          <div className="success-message">
            ✅ Success! Delegate purchase completed successfully.
            {successData && (
              <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Weather Forecast:</div>
                <div>🌤️ <strong>Weather:</strong> {successData.weather}</div>
                <div>🌡️ <strong>Temperature:</strong> {successData.temperature}°F</div>
                <div>📅 <strong>Date:</strong> {successData.futureDate}</div>
              </div>
            )}
          </div>
        )}

        {!address && (
          <p className="helper-text">
            Please connect your Porto wallet first
          </p>
        )}

        <div className="collapsible-info">
          <button 
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="info-toggle-button"
          >
            {isInfoExpanded ? '▼' : '▶'} Details
          </button>
          
          <div className={`info-section ${isInfoExpanded ? 'expanded' : 'collapsed'}`}>
            <p>
              This allows the merchant server to execute payments on your behalf of your Porto Account.
              This works by granting permissions to the merchant server's address.
            </p>
            <DelegateSequenceDiagram />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DelegatePurchaseButton;