import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ServerActions } from 'porto/viem'
import { createClient, http, parseEther, hashTypedData } from 'viem'
import { baseSepolia } from 'wagmi/chains'
import { readContract } from 'viem/actions';
import { PORTO_ABI } from './abi';
import { SequenceDiagram } from './SequenceDiagram';

export interface KeyData {
  expiry: number
  keyType: number
  isSuperAdmin: boolean
  publicKey: string
}

interface WalletProvider {
  request: (args: { method: string; params: unknown[] }) => Promise<unknown>
}

export const PurchaseButton: React.FC = () => {
  const { address, connector } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  // const demonstrateIssue = async () => {
  //   if (!walletClient || !address) {
  //     console.log('❌ Wallet client or address not available');
  //     return;
  //   }
  //   setIsProcessing(true);

  //   try {
  //     const client = createClient({
  //       chain: baseSepolia,
  //       transport: http('https://base-sepolia.rpc.ithaca.xyz'),
  //     })

  //     const superAdminKey = await readContract(client, {
  //       address: address as `0x${string}`,
  //       abi: PORTO_ABI,
  //       functionName: 'keyAt',
  //       args: [BigInt(0)],
  //     })

  //     console.log('Super admin key:', superAdminKey);

  //     const eip712Domain = await readContract(client, {
  //       address: address as `0x${string}`,
  //       abi: PORTO_ABI,
  //       functionName: 'eip712Domain',
  //     })
  //     const eip712DomainName = eip712Domain[1] as string;
  //     const eip712DomainVersion = eip712Domain[2] as string;

  //     const prepareCallsResponse = await ServerActions.prepareCalls(client, { 
  //       account: address as `0x${string}`, 
  //       calls: [{ 
  //         to: address as `0x${string}`,
  //         value: parseEther("0.00001"), 
  //         data: '0x' as `0x${string}`,
  //       }], 
  //       key: {
  //         publicKey: superAdminKey.publicKey,
  //         type: "webauthn-p256",
  //       }, 
  //       feeToken: '0x29f45fc3ed1d0ffafb5e2af9cc6c3ab1555cd5a2',
  //     });

  //     console.log('Server prepared calls response:', prepareCallsResponse);

  //     // Also try wallet_prepareCalls for comparison
  //     const walletPrepareResponse = await (walletClient as any).request({
  //       method: 'wallet_prepareCalls',
  //       params: [{
  //         calls: [{
  //           to: address as `0x${string}`,
  //           value: `0x${parseEther("0.00001").toString(16)}`,
  //           data: "0x"
  //         }],
  //         key: {
  //           publicKey: superAdminKey.publicKey,
  //           type: "webauthn-p256"
  //         },
  //         capabilities: {
  //           feeToken: '0x29f45fc3ed1d0ffafb5e2af9cc6c3ab1555cd5a2'
  //         }
  //       }]
  //     });

  //     console.log('Wallet prepared calls response:', walletPrepareResponse);

  //     // Extract nonce from server response
  //     const nonce = prepareCallsResponse.context?.quote?.intent?.nonce;
  //     if (!nonce) {
  //       console.log('❌ No nonce found in prepareCalls response');
  //       return;
  //     }

  //     // Build typed data structure for EIP-712 signing
  //     const typedData = {
  //       domain: {
  //         chainId: baseSepolia.id,
  //         name: eip712DomainName,
  //         verifyingContract: address as `0x${string}`,
  //         version: eip712DomainVersion,
  //       },
  //       message: {
  //         multichain: false,
  //         calls: [{
  //           to: address as `0x${string}`,
  //           value: `0x${parseEther("0.00001").toString(16)}`,
  //           data: '0x' as `0x${string}`,
  //         }],
  //         nonce: `0x${nonce.toString(16)}`,
  //       },
  //       primaryType: 'Execute',
  //       types: {
  //         Call: [
  //           { name: 'to', type: 'address' },
  //           { name: 'value', type: 'uint256' },
  //           { name: 'data', type: 'bytes' },
  //         ],
  //         Execute: [
  //           { name: 'multichain', type: 'bool' },
  //           { name: 'calls', type: 'Call[]' },
  //           { name: 'nonce', type: 'uint256' },
  //         ],
  //       },
  //     }

  //     // Compute local EIP-712 hash
  //     const localHash = hashTypedData(typedData as any);

  //     console.log('=== HASH COMPARISON ===');
  //     console.log('Local EIP-712 hash:', localHash);
  //     console.log('Server digest:', prepareCallsResponse.digest);
  //     console.log('Hashes match:', localHash === prepareCallsResponse.digest);

  //     // Get provider and sign the typed data
  //     const provider = await connector?.getProvider() as WalletProvider

  //     const signature = await provider?.request({ 
  //       method: 'eth_signTypedData_v4', 
  //       params: [address as `0x${string}`, JSON.stringify(typedData)], 
  //     }) as `0x${string}`

  //     console.log('Generated signature:', signature);

  //     // Verify signature using wallet method
  //     const isValid = await provider?.request({
  //       method: 'wallet_verifySignature',
  //       params: [{
  //         address: address as `0x${string}`,
  //         signature: signature,
  //         digest: localHash as `0x${string}`, 
  //         chainId: `0x${baseSepolia.id.toString(16)}`,
  //       }]
  //     }) as {valid: boolean}

  //     console.log('=== VERIFICATION RESULT ===');
  //     if (isValid.valid) {
  //       console.log('✅ Signature verification successful:', isValid);
  //     } else {
  //       console.log('❌ Signature verification failed:', isValid);
  //     }

  //   } catch (error) {
  //     console.log(`❌ Error during process: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handlePurchase = async () => {
    setIsProcessing(true);
    setIsSuccess(false);
    setSuccessData(null);

    try {
      if (false) {
        const response = await fetch(`/api/weather`);
        if (response.ok) {
          const data = await response.json();
          console.log(data);
          setIsSuccess(true);
          setSuccessData(data);
        } else if (response.status === 402) {
          console.error('Failed to fetch premium data');
        } else {
          throw new Error('Failed to fetch premium data: Status ' + response.status + ' ' + response.statusText);
        }
      } else {
        // TODO: Server does not yet support this.
        console.log('Server does not yet support this.');
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
          {isProcessing ? 'Processing...' : 'Purchase'}
        </button>

        {isSuccess && (
          <div className="success-message">
            ✅ Success! Purchase completed successfully.
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
              Pay for paywalled content by signing a digest that authorizes a call bundle containing the payment transaction. This signature permits the execution of the payment on your behalf.
            </p>
            <PurchaseSequenceDiagram />
          </div>
        </div>
      </div>
    </div>
  );
};

// Purchase-specific sequence diagram
const PurchaseSequenceDiagram: React.FC = () => {
  const diagramDefinition = `
    sequenceDiagram
      participant User
      participant Server
      
      User->>Server: Request Payment Authorization
      Server->>User: Present Signature Request
      User->>Server: Sign Payment Digest
      Server->>User: Execute Payment
      Server->>User: Payment Confirmation
  `;

  return (
    <SequenceDiagram
      title="Payment Authorization Sequence"
      diagramDefinition={diagramDefinition}
      idPrefix="payment"
    />
  );
};

export default PurchaseButton;