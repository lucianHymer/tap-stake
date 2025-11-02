import { mainnet } from "viem/chains";
import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { CHAIN } from "./chain";

export const wagmiConfig = createConfig({
  chains: [CHAIN, mainnet],
  connectors: [injected()],
  transports: {
    [CHAIN.id]: http(),
    [mainnet.id]: http(), // Required for ENS resolution
  },
});
