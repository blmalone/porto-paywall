import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { hashTypedData } from 'viem'
import { readContract } from 'viem/actions';
import { PORTO_ABI } from './abi';
import { SequenceDiagram } from './SequenceDiagram';
import JSONbig from 'json-bigint';

export interface KeyData {
  expiry: number
  keyType: number
  isSuperAdmin: boolean
  publicKey: string
}

interface WeatherData {
  price: string
  weather: string
  temperature: string
  futureDate: string
}

export const PurchaseButton = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<WeatherData | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    setIsSuccess(false);
    setSuccessData(null);

    try {
      const step1 = await fetch(`/api/self/weather`, {
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
        if (!walletClient) throw new Error('Wallet client not available');

        const superAdminKey = await readContract(walletClient, {
          address: address as `0x${string}`,
          abi: PORTO_ABI,
          functionName: 'keyAt',
          args: [BigInt(0)],
        })

        console.log('Super admin key:', superAdminKey);

        const data = await step1.json();
        const prepareCalls = JSONbig.parse(data.prepareCalls);
        const typedData = prepareCalls.typedData;
        const typedDataHash = hashTypedData(typedData);

        const recomputedTypedDataHash = hashTypedData(typedData);
        console.log('Recomputed typed data hash:', recomputedTypedDataHash);

        if (recomputedTypedDataHash !== typedDataHash) {
          throw new Error('Typed data hash mismatch');
        }

        const signature = await walletClient.signTypedData({
          account: address as `0x${string}`,
          ...typedData,
        }) as `0x${string}`;
        console.log('Signature:', signature);

        const step2 = await fetch(`/api/self/weather`, {
          headers: {
            'X-PAYMENT': signature,
            'X-USER-ADDRESS': address as `0x${string}`
          }
        });
        console.log(step2);
        const step2Data = await step2.json();

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
          onClick={handlePurchase}
          disabled={isProcessing || !address}
          className="primary-button"
        >
          {isProcessing ? 'Processing...' : 'Pay'}
        </button>

        {isSuccess && (
          <div className="success-message">
            ✅ {successData?.price} purchase complete
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
            {isInfoExpanded ? '▼' : '▶'} Explanation
          </button>

          <div className={`info-section ${isInfoExpanded ? 'expanded' : 'collapsed'}`}>
            <p>
              User/Agent can pay for paywalled content by signing an intent to pay the merchant X amount for the content.
              The merchant sends the final payment transaction onchain before returning the paywalled content.
            </p>
            <PurchaseSequenceDiagram />
          </div>
        </div>
      </div>
    </div>
  );
};

// Purchase-specific sequence diagram
const PurchaseSequenceDiagram = () => {
  const diagramDefinition = `
    sequenceDiagram
      participant User
      participant Server
      
      User->>Server: Request Paywalled Content (1 click)
      Server->>Server: Checks for non-existent X-PAYMENT header.
      Server->>Server: Compute intent and quote for user to sign.
      Server->>User: Returns: Status Code: 402, Intent and Quote
      User->>User: Sign Intent (2 clicks)
      User->>Server: Retries retrieving paywalled content (X-PAYMENT set to signed intent signature.)
      Server->>Server: Verify signature matches expected intent and quote.
      Server->>Server: Execute payment.
      Server->>User: Returns: Status Code: 200, Paywalled Content
      User->>User: Displays Content
  `;

  return (
    <SequenceDiagram
      title="Self Authorize Payment"
      diagramDefinition={diagramDefinition}
      idPrefix="payment"
    />
  );
};

export default PurchaseButton;