import { optimismSepolia } from 'viem/chains';
import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [optimismSepolia],
  connectors: [injected()],
  transports: {
    [optimismSepolia.id]: http(),
  },
});
