import { porto } from 'porto/wagmi'
import { createConfig, http } from 'wagmi'  
import { baseSepolia } from 'wagmi/chains'  
  
export const wagmiConfig = createConfig({  
  chains: [baseSepolia],  
  connectors: [porto()],
  transports: {  
    [baseSepolia.id]: http(),  
  },  
});