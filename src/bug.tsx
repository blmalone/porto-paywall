import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ServerActions } from 'porto/viem'
import { createClient, http } from 'viem'
import { baseSepolia } from 'wagmi/chains'  

/**
 * Minimal Reproducible Example for WebAuthn Signature Verification Issue
 * 
 * Problem: When using signMessage() with a WebAuthn key from Porto wallet,
 * the signature format doesn't validate with ServerActions.verifySignature.
 */
export const ReproduceWebAuthnSignatureIssue: React.FC = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const demonstrateIssue = async () => {
    if (!walletClient || !address) {
      console.log('❌ Wallet client or address not available');
      return;
    }
    setIsProcessing(true);

    try {
      const digest = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      console.log('🔄 Step 1: Getting digest from server (mock) - ', digest);
      console.log('🔄 Step 2: Signing digest with WebAuthn key...');
      
      const signature = await walletClient.signMessage({
        account: address,
        message: digest,
      });

      console.log(`✅ Signature received: ${signature}`);
      console.log('🔄 Step 3: Attempting server verification (mock)...');

      const client = createClient({
        chain: baseSepolia,
        transport: http('https://base-sepolia.rpc.ithaca.xyz'),
      })

      const isValid = await ServerActions.verifySignature(client, {
        address: address as `0x${string}`,
        signature: signature as `0x${string}`,
        digest: digest as `0x${string}`,
        chain: baseSepolia,
      })

      console.log('🔄 Step 4: Verification result - ', isValid.valid);

    } catch (error) {
      console.log(`❌ Error during process: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={demonstrateIssue}
          disabled={isProcessing || !address}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isProcessing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? '🔄 Processing...' : 'Sign'}
        </button>
        
        {!address && (
          <p style={{ color: '#666', marginTop: '10px' }}>
            Please connect your Porto wallet first
          </p>
        )}
      </div>
    </div>
  );
};

export default ReproduceWebAuthnSignatureIssue; 