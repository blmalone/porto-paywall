import { porto } from 'porto/wagmi'
import { createConfig, http } from 'wagmi'  
import { baseSepolia } from 'wagmi/chains'  
  
export const wagmiConfig = createConfig({  
  chains: [baseSepolia],  
  connectors: [porto({merchantRpcUrl: "http://localhost:8787/rpc"})],
  transports: {  
    [baseSepolia.id]: http(),  
  },  
});