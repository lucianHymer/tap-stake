import { mainnet, optimismSepolia } from 'viem/chains';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [optimismSepolia, mainnet],
  connectors: [injected()],
  transports: {
    [optimismSepolia.id]: http(),
    [mainnet.id]: http(), // Required for ENS resolution
  },
});
