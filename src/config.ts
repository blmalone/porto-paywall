import { porto } from 'porto/wagmi'
import { createConfig, http } from 'wagmi'  
import { baseSepolia } from 'wagmi/chains'  
import { Mode } from 'porto'
  
export const wagmiConfig = createConfig({  
  chains: [baseSepolia],  
  connectors: [porto({merchantRpcUrl: "http://localhost:8787/rpc", mode: Mode.dialog() })],
  transports: {  
    [baseSepolia.id]: http("https://base-sepolia.rpc.ithaca.xyz"),  
  },  
});