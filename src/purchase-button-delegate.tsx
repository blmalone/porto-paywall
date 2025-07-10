import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { waitForCallsStatus } from 'viem/actions';
import { WalletActions } from 'porto/viem'
import { SequenceDiagram } from './SequenceDiagram';
import { SERVER_URL } from './constants'

interface WeatherData {
  price?: string
  weather: string
  temperature: string
  futureDate: string
}

interface PaymentResponse {
  accepts: {
    asset: string
    payTo: string
    maxAmountRequired: string
  }
}

interface CallsStatus {
  statusCode: number
}

const DelegateSequenceDiagram = () => {
  const diagramDefinition = `
    sequenceDiagram
      participant User
      participant Server
      
      User->>Server: Request Paywalled Content (1 click)
      Server->>Server: Tries to pull payment from user's wallet and fails.
      Server->>User: Returns: Status Code: 402, Content Price, Receipt/Merchant Server Address, ERC20 Token Address
      User->>User: Grants Permissions to Merchant Server Address (2 clicks)
      User->>User: No-op onchain transaction to force preCalls from wallet_grantPermissions onchain (2 clicks)
      User->>Server: Retries retrieving paywalled content (X-PAYMENT set to JWT token from SIWE - prevents anyone else from accessing prepaid content.)
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

export const DelegatePurchaseButton = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<WeatherData | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const handleDelegatePurchase = async () => {
    setIsProcessing(true);
    setIsSuccess(false);
    setSuccessData(null);

    try {
      const step1 = await fetch(`${SERVER_URL}/api/delegated/weather`, {
        headers: {}
      });
      console.log(step1);
      if (step1.ok) {
        const data = await step1.json();
        console.log(data);
        setIsSuccess(true);
        setSuccessData(data);
      } else if (step1.status === 402) {
        console.log("402 returned.")
        const data: PaymentResponse = await step1.json();
        console.log(data);
        const token = data.accepts.asset;
        const serverAddress = data.accepts.payTo;
        const limit = data.accepts.maxAmountRequired;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await WalletActions.grantPermissions(walletClient as any, {
          expiry: Math.floor(Date.now() / 1_000) + 60, // 60 seconds
          key: {
            publicKey: serverAddress as `0x${string}`,
            type: "secp256k1"
          },
          permissions: {
            calls: [{
              signature: 'transfer(address,uint256)',
              to: token as `0x${string}`
            }],
            spend: [{
              limit: BigInt(limit),
              period: 'minute',
              token: token as `0x${string}`,
            }]
          }
        })


        // No-op to force preCalls from wallet_grantPermissions onchain.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { id } = await (walletClient as any).request({
          method: 'wallet_sendCalls',
          params: [{ calls: [] }] // Empty calls array  
        })

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const status = await waitForCallsStatus(walletClient as any, {
          id,
          status: (status: CallsStatus) => status.statusCode === 200,
          timeout: 20_000,
        });
        console.log("Waiting for calls status: ", status);

        if (status.statusCode !== 200) {
          throw new Error('Failed to send calls: Status ' + status.statusCode);
        }

        const step2 = await fetch(`${SERVER_URL}/api/delegated/weather`, {
          headers: {
            'X-PAYMENT': "Cookie proves we are who we say we are."
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
          {isProcessing ? 'Processing...' : 'Pay via Server'}
        </button>

        {isSuccess && (
          <div className="success-message">
            {successData && (
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
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
              This allows the merchant server to execute payments on behalf of your Porto Account.
              It works by granting permissions to the merchant server's address.
              A potential timing attack, where an adversary calls the paywalled content API before the actual user after permissions are granted, is mitigated by requiring the API to authenticate the user using their JWT token.
            </p>
            <DelegateSequenceDiagram />
          </div>
        </div>
      </div>
    </div>
  );
};

export const RevokePermissionsButton = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);

  const handleRevokePermissions = async () => {
    setIsRevoking(true);
    setIsRevoked(false);
    const serverAddress = "0x23016fdcc2443ee4576c59809266545b36b52d39".toLowerCase();

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const permissions = await WalletActions.getPermissions(walletClient as any, {
        address: address as `0x${string}`,
      })
      console.log(permissions);
      const countServerPermissions = permissions.filter(permission => permission.id.toLowerCase() === serverAddress).length;
      console.log(`Found ${countServerPermissions} server permissions.`);

      for (const permission of permissions) {
        console.log(permission.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await WalletActions.revokePermissions(walletClient as any, {
          address: address as `0x${string}`,
          id: permission.id as `0x${string}`, // Permission ID to revoke
        });
      }

      setIsRevoked(true);
      console.log('All permissions revoked successfully');
    } catch (error) {
      console.error('Error revoking permissions:', error);
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="component-container">
      <div className="button-group">
        <button
          onClick={handleRevokePermissions}
          disabled={isRevoking || !address}
          className="disconnect-button"
          style={{ width: '200px', maxWidth: '280px' }}
        >
          {isRevoking ? 'Revoking...' : 'Revoke Permissions'}
        </button>

        {isRevoked && (
          <div className="success-message">
            ✅ All merchant permissions have been revoked successfully.
          </div>
        )}

        {!address && (
          <p className="helper-text">
            Please connect your Porto wallet first
          </p>
        )}
      </div>
    </div>
  );
};

export default DelegatePurchaseButton;