import { createConfig, http } from 'wagmi';
import { optimismSepolia } from 'viem/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [optimismSepolia],
  connectors: [
    injected()
  ],
  transports: {
    [optimismSepolia.id]: http()
  }
});