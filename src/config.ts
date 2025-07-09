import { porto } from 'porto/wagmi'
import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { Mode } from 'porto'

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: false,
  connectors: [porto({ merchantRpcUrl: "https://api.porto.blainemalone.com/rpc", mode: Mode.dialog(), authUrl: "https://api.porto.blainemalone.com" })],
  transports: {
    [baseSepolia.id]: http("https://base-sepolia.rpc.ithaca.xyz"),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}