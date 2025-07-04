import React, { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ServerActions } from 'porto/viem'
import { createClient, http, parseEther, hashTypedData } from 'viem'
import { baseSepolia } from 'wagmi/chains'
import { readContract } from 'viem/actions';
import { PORTO_ABI } from './abi';

export interface KeyData {
  expiry: number
  keyType: number
  isSuperAdmin: boolean
  publicKey: string
}

interface WalletProvider {
  request: (args: { method: string; params: unknown[] }) => Promise<unknown>
}

/**
 * Minimal Reproducible Example for WebAuthn Signature Verification Issue
 * 
 * This component demonstrates the process of signing EIP-712 typed data with Porto's WebAuthn
 * implementation and compares the local hash computation with the server's digest.
 */
export const ReproduceWebAuthnSignatureIssue: React.FC = () => {
  const { address, connector } = useAccount()
  const { data: walletClient } = useWalletClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const demonstrateIssue = async () => {
    if (!walletClient || !address) {
      console.log('❌ Wallet client or address not available');
      return;
    }
    setIsProcessing(true);

    try {
      const client = createClient({
        chain: baseSepolia,
        transport: http('https://base-sepolia.rpc.ithaca.xyz'),
      })

      const superAdminKey = await readContract(client, {
        address: address as `0x${string}`,
        abi: PORTO_ABI,
        functionName: 'keyAt',
        args: [BigInt(0)],
      })

      console.log('Super admin key:', superAdminKey);

      const eip712Domain = await readContract(client, {
        address: address as `0x${string}`,
        abi: PORTO_ABI,
        functionName: 'eip712Domain',
      })
      const eip712DomainName = eip712Domain[1] as string;
      const eip712DomainVersion = eip712Domain[2] as string;

      const prepareCallsResponse = await ServerActions.prepareCalls(client, { 
        account: address as `0x${string}`, 
        calls: [{ 
          to: address as `0x${string}`,
          value: parseEther("0.00001"), 
          data: '0x' as `0x${string}`,
        }], 
        key: {
          publicKey: superAdminKey.publicKey,
          type: "webauthn-p256",
        }, 
        feeToken: '0x29f45fc3ed1d0ffafb5e2af9cc6c3ab1555cd5a2',
      });

      console.log('Server prepared calls response:', prepareCallsResponse);

      // Also try wallet_prepareCalls for comparison
      const walletPrepareResponse = await (walletClient as any).request({
        method: 'wallet_prepareCalls',
        params: [{
          calls: [{
            to: address as `0x${string}`,
            value: `0x${parseEther("0.00001").toString(16)}`,
            data: "0x"
          }],
          key: {
            publicKey: superAdminKey.publicKey,
            type: "webauthn-p256"
          },
          capabilities: {
            feeToken: '0x29f45fc3ed1d0ffafb5e2af9cc6c3ab1555cd5a2'
          }
        }]
      });

      console.log('Wallet prepared calls response:', walletPrepareResponse);

      // Extract nonce from server response
      const nonce = prepareCallsResponse.context?.quote?.intent?.nonce;
      if (!nonce) {
        console.log('❌ No nonce found in prepareCalls response');
        return;
      }

      // Build typed data structure for EIP-712 signing
      const typedData = {
        domain: {
          chainId: baseSepolia.id,
          name: eip712DomainName,
          verifyingContract: address as `0x${string}`,
          version: eip712DomainVersion,
        },
        message: {
          multichain: false,
          calls: [{
            to: address as `0x${string}`,
            value: `0x${parseEther("0.00001").toString(16)}`,
            data: '0x' as `0x${string}`,
          }],
          nonce: `0x${nonce.toString(16)}`,
        },
        primaryType: 'Execute',
        types: {
          Call: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
          ],
          Execute: [
            { name: 'multichain', type: 'bool' },
            { name: 'calls', type: 'Call[]' },
            { name: 'nonce', type: 'uint256' },
          ],
        },
      }

      // Compute local EIP-712 hash
      const localHash = hashTypedData(typedData as any);
      
      console.log('=== HASH COMPARISON ===');
      console.log('Local EIP-712 hash:', localHash);
      console.log('Server digest:', prepareCallsResponse.digest);
      console.log('Hashes match:', localHash === prepareCallsResponse.digest);

      // Get provider and sign the typed data
      const provider = await connector?.getProvider() as WalletProvider

      const signature = await provider?.request({ 
        method: 'eth_signTypedData_v4', 
        params: [address as `0x${string}`, JSON.stringify(typedData)], 
      }) as `0x${string}`

      console.log('Generated signature:', signature);

      // Verify signature using wallet method
      const isValid = await provider?.request({
        method: 'wallet_verifySignature',
        params: [{
          address: address as `0x${string}`,
          signature: signature,
          digest: prepareCallsResponse.digest as `0x${string}`, 
          chainId: `0x${baseSepolia.id.toString(16)}`,
        }]
      }) as {valid: boolean}

      console.log('=== VERIFICATION RESULT ===');
      if (isValid.valid) {
        console.log('✅ Signature verification successful:', isValid);
      } else {
        console.log('❌ Signature verification failed:', isValid);
      }

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
          {isProcessing ? 'Processing...' : 'Test WebAuthn Signature'}
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