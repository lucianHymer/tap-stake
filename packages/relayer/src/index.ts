import {
  createWalletClient,
  createPublicClient,
  http,
  type Hex,
  type Address,
  parseTransaction,
  serializeTransaction,
  encodeFunctionData
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';
import { recoverAuthorizationAddress } from 'viem/experimental';

export interface Env {
  PRIVATE_KEY: string;
  RPC_URL: string;
  CHAIN_ID: string;
  ENVIRONMENT?: string;
}

interface RelayRequest {
  authorization: {
    contractAddress: Address;
    chainId: number;
    nonce: bigint | string;
    r: Hex;
    s: Hex;
    yParity: number;
  };
  amount: string; // Amount to stake in wei - no signatures needed!
}

interface RelayResponse {
  success: boolean;
  txHash?: Hex;
  error?: string;
  details?: any;
}

// Helper to get chain config from chain ID
function getChainConfig(chainId: number) {
  // For now just support OP Sepolia, can add more chains later
  if (chainId === 11155420) {
    return optimismSepolia;
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed',
          details: 'Only POST requests are accepted'
        }),
        {
          status: 405,
          headers: corsHeaders
        }
      );
    }

    try {
      // Parse request body
      const body = await request.json() as RelayRequest;

      // Validate required fields
      if (!body.authorization || !body.amount) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields',
            details: 'Request must include authorization and amount fields'
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Get chain configuration
      const chainId = parseInt(env.CHAIN_ID);
      const chain = getChainConfig(chainId);

      // Validate authorization chain ID matches
      const authChainId = typeof body.authorization.chainId === 'string'
        ? parseInt(body.authorization.chainId)
        : body.authorization.chainId;
      if (authChainId !== chainId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Chain ID mismatch',
            details: `Authorization chain ID ${authChainId} does not match relayer chain ID ${chainId}`
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Create wallet client for the relayer
      const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);
      const walletClient = createWalletClient({
        account,
        chain,
        transport: http(env.RPC_URL),
      });

      // Create public client for reading chain data
      const publicClient = createPublicClient({
        chain,
        transport: http(env.RPC_URL),
      });

      // Convert string values to proper types
      const authorization = {
        address: body.authorization.contractAddress, // viem expects 'address' field
        chainId: authChainId,
        nonce: typeof body.authorization.nonce === 'string'
          ? parseInt(body.authorization.nonce)
          : Number(body.authorization.nonce), // viem expects number not bigint
        r: body.authorization.r,
        s: body.authorization.s,
        yParity: body.authorization.yParity,
      };


      // Verify the authorization was signed by the expected address
      // We recover the address from the authorization to ensure it matches what we expect
      let signerAddress: Address;
      try {
        // @ts-ignore - TypeScript doesn't know about EIP-7702 types yet
        signerAddress = await recoverAuthorizationAddress({
          authorization,
        });
        console.log('Authorization verification:', {
          recoveredAddress: signerAddress,
          contractAddress: authorization.address,
        });
      } catch (verifyError: any) {
        console.error('Failed to verify authorization:', verifyError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid authorization signature',
            details: 'Could not recover signer from authorization'
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Parse and validate amount
      const amount = BigInt(body.amount);
      const MAX_STAKE_PER_TX = BigInt("1000000000000000000000"); // 1000 tokens

      if (amount > MAX_STAKE_PER_TX) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Amount too high',
            details: `Amount ${amount.toString()} exceeds maximum ${MAX_STAKE_PER_TX.toString()}`
          }),
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }

      // Build the stake call data - simple!
      const STAKER_WALLET_ABI = [
        {
          name: "stake",
          type: "function",
          inputs: [
            { name: "amount", type: "uint256" }
          ],
          outputs: [],
        },
      ] as const;

      const callData = encodeFunctionData({
        abi: STAKER_WALLET_ABI,
        functionName: "stake",
        args: [amount],
      });

      console.log('Relaying transaction:', {
        from: account.address,
        to: signerAddress, // Send to the EOA that signed the authorization
        authorizationList: [authorization],
        data: callData,
      });

      // Send the transaction with the authorization
      // @ts-ignore - TypeScript doesn't know about authorizationList yet
      const txHash = await walletClient.sendTransaction({
        account,
        to: signerAddress, // The EOA that will be delegated
        data: callData,
        value: 0n,
        authorizationList: [authorization],
        chain,
      });

      console.log('Transaction sent:', txHash);

      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          txHash,
          details: {
            relayer: account.address,
            chainId,
            eoa: signerAddress,
            delegatedTo: authorization.address,
            amount: amount.toString(),
          }
        } as RelayResponse),
        {
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (error: any) {
      console.error('Relay error:', error);

      // Extract useful error information
      const errorDetails = {
        message: error.message || 'Unknown error',
        cause: error.cause,
        details: error.details,
        shortMessage: error.shortMessage,
        metaMessages: error.metaMessages,
      };

      return new Response(
        JSON.stringify({
          success: false,
          error: error.shortMessage || error.message || 'Transaction failed',
          details: errorDetails,
        } as RelayResponse),
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }
  },
};