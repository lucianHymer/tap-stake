import {
  http,
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { optimismSepolia } from 'viem/chains';
import { recoverAuthorizationAddress } from 'viem/experimental';

export interface Env {
  PRIVATE_KEY: string;
  RPC_URL: string;
  CHAIN_ID: string;
  ALLOWED_CONTRACT_ADDRESS: string;
  APPROVED_CHOICE_IDS: string; // Comma-separated list of approved choice IDs
  TOKEN_ADDRESS: string; // The ERC20 token being staked (e.g., GTC)
  STAKE_CHOICES_ADDRESS: string; // The StakeChoicesERC6909 contract
  MINIMUM_HOLDINGS: string; // Minimum total holdings in wei (e.g., 90e18)
  ENVIRONMENT?: string;
}

type OperationType = 'addStakes' | 'updateStakes' | 'withdraw' | 'unstakeAllAndWithdraw';

interface RelayRequest {
  operation: OperationType;
  authorization: {
    address: Address;
    chainId: number;
    nonce: bigint | string;
    r: Hex;
    s: Hex;
    yParity: number;
  };
  // For addStakes
  choiceIds?: string[];
  amounts?: string[];
  // For updateStakes
  oldChoiceIds?: string[];
  oldAmounts?: string[];
  newChoiceIds?: string[];
  newAmounts?: string[];
  // For withdraw and unstakeAllAndWithdraw
  recipient?: string;
}

interface RelayResponse {
  success: boolean;
  txHash?: Hex;
  error?: string;
  details?: Record<string, unknown>;
}

// ABIs for contract interactions
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// Test-only ABI for TestERC20 with public mint function
const TEST_ERC20_ABI = [
  ...ERC20_ABI,
  {
    name: 'mint',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

const ERC6909_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

const STAKER_WALLET_ABI = [
  {
    name: 'addStakes',
    type: 'function',
    inputs: [
      { name: 'choiceIds', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'updateStakes',
    type: 'function',
    inputs: [
      { name: 'oldChoiceIds', type: 'uint256[]' },
      { name: 'oldAmounts', type: 'uint256[]' },
      { name: 'newChoiceIds', type: 'uint256[]' },
      { name: 'newAmounts', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [{ name: 'recipient', type: 'address' }],
    outputs: [],
  },
  {
    name: 'unstakeAllAndWithdraw',
    type: 'function',
    inputs: [
      { name: 'choiceIds', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [],
  },
] as const;

// Helper to parse approved choice IDs from environment
function parseApprovedChoiceIds(env: Env): bigint[] {
  try {
    return env.APPROVED_CHOICE_IDS.split(',').map((id) => BigInt(id.trim()));
  } catch (error) {
    throw new Error('Invalid APPROVED_CHOICE_IDS configuration');
  }
}

// Helper to get chain config from chain ID
function getChainConfig(chainId: number): typeof optimismSepolia {
  // For now just support OP Sepolia, can add more chains later
  if (chainId === 11155420) {
    return optimismSepolia;
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

// Helper to validate non-zero amounts
function validateNonZeroAmounts(amounts: bigint[]): boolean {
  return amounts.every((amount) => amount > 0n);
}

// Helper to verify minimum holdings (wallet balance + staked balances)
async function verifyMinimumHoldings(
  publicClient: any,
  signerAddress: Address,
  tokenAddress: Address,
  stakeChoicesAddress: Address,
  approvedChoiceIds: bigint[],
  minimumHoldings: bigint
): Promise<{ valid: boolean; totalHoldings: bigint; walletBalance: bigint; totalStaked: bigint }> {
  try {
    // Get wallet ERC20 balance
    const walletBalance = (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [signerAddress],
    })) as bigint;

    // Get staked balances for all approved choice IDs
    const stakedBalances = await Promise.all(
      approvedChoiceIds.map((choiceId) =>
        publicClient.readContract({
          address: stakeChoicesAddress,
          abi: ERC6909_ABI,
          functionName: 'balanceOf',
          args: [signerAddress, choiceId],
        })
      )
    );

    const totalStaked = stakedBalances.reduce((sum: bigint, bal) => sum + (bal as bigint), 0n);
    const totalHoldings = walletBalance + totalStaked;

    return {
      valid: totalHoldings >= minimumHoldings,
      totalHoldings,
      walletBalance,
      totalStaked,
    };
  } catch (error) {
    throw new Error(`Failed to verify holdings: ${error}`);
  }
}

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Test mint endpoint handler - only works on Optimism Sepolia
async function handleTestMint(request: Request, env: Env): Promise<Response> {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed',
        details: 'Only POST requests are accepted',
      }),
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Validate chain ID is Optimism Sepolia
    const chainId = Number.parseInt(env.CHAIN_ID);
    if (chainId !== 11155420) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Test mint only available on Optimism Sepolia',
          details: `Current chain ID is ${chainId}, but test mint only works on 11155420 (Optimism Sepolia)`,
        }),
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Parse request body
    const body = (await request.json()) as {
      address: Address;
      amount: string;
    };

    // Validate required fields
    if (!body.address || !body.amount) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields',
          details: 'Request must include address and amount fields',
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Parse amount
    const amount = BigInt(body.amount);
    if (amount <= 0n) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid amount',
          details: 'Amount must be greater than 0',
        }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Get chain configuration
    const chain = getChainConfig(chainId);

    // Create wallet client for the relayer
    const account = privateKeyToAccount(env.PRIVATE_KEY as Hex);
    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(env.RPC_URL),
    });

    if (env.ENVIRONMENT !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Test minting:', {
        to: body.address,
        amount: amount.toString(),
        tokenAddress: env.TOKEN_ADDRESS,
      });
    }

    // Call mint function on TestERC20
    const txHash = await walletClient.writeContract({
      address: env.TOKEN_ADDRESS as Address,
      abi: TEST_ERC20_ABI,
      functionName: 'mint',
      args: [body.address, amount],
    });

    if (env.ENVIRONMENT !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Mint transaction sent:', txHash);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        txHash,
        details: {
          to: body.address,
          amount: amount.toString(),
          tokenAddress: env.TOKEN_ADDRESS,
          minter: account.address,
        },
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    if (env.ENVIRONMENT !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Mint error:', error);
    }

    const err = error as Error & {
      cause?: unknown;
      details?: unknown;
      shortMessage?: string;
      metaMessages?: unknown;
    };

    const errorDetails = {
      message: err.message || 'Unknown error',
      cause: err.cause,
      details: err.details,
      shortMessage: err.shortMessage,
      metaMessages: err.metaMessages,
    };

    return new Response(
      JSON.stringify({
        success: false,
        error: err.shortMessage || err.message || 'Mint failed',
        details: errorDetails,
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Get the URL path for routing
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to test mint endpoint
    if (path === '/test-mint') {
      return handleTestMint(request, env);
    }

    // Only accept POST requests for relay endpoint
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed',
          details: 'Only POST requests are accepted',
        }),
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

    try {
      // Parse request body
      const body = (await request.json()) as RelayRequest;

      // Validate required fields
      if (!body.authorization || !body.operation) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields',
            details: 'Request must include authorization and operation fields',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // Validate operation type
      const validOperations: OperationType[] = [
        'addStakes',
        'updateStakes',
        'withdraw',
        'unstakeAllAndWithdraw',
      ];
      if (!validOperations.includes(body.operation)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid operation',
            details: `Operation must be one of: ${validOperations.join(', ')}`,
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // Validate operation-specific required fields
      if (body.operation === 'addStakes') {
        if (!body.choiceIds || !body.amounts) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing required fields for addStakes',
              details: 'addStakes requires choiceIds and amounts',
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
        if (body.choiceIds.length !== body.amounts.length) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Array length mismatch',
              details: `choiceIds length (${body.choiceIds.length}) must match amounts length (${body.amounts.length})`,
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
        if (body.choiceIds.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Empty arrays',
              details: 'Must provide at least one choice to stake',
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
      } else if (body.operation === 'updateStakes') {
        if (!body.newChoiceIds || !body.newAmounts) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing required fields for updateStakes',
              details: 'updateStakes requires newChoiceIds and newAmounts',
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
        if (body.newChoiceIds.length !== body.newAmounts.length) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Array length mismatch',
              details: `newChoiceIds length (${body.newChoiceIds.length}) must match newAmounts length (${body.newAmounts.length})`,
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
        if (
          body.oldChoiceIds &&
          body.oldAmounts &&
          body.oldChoiceIds.length !== body.oldAmounts.length
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Array length mismatch',
              details: `oldChoiceIds length (${body.oldChoiceIds.length}) must match oldAmounts length (${body.oldAmounts.length})`,
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
      } else if (body.operation === 'withdraw') {
        if (!body.recipient) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing required fields for withdraw',
              details: 'withdraw requires recipient address',
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
      } else if (body.operation === 'unstakeAllAndWithdraw') {
        if (!body.recipient || !body.choiceIds || !body.amounts) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing required fields for unstakeAllAndWithdraw',
              details: 'unstakeAllAndWithdraw requires choiceIds, amounts, and recipient',
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
        if (body.choiceIds.length !== body.amounts.length) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Array length mismatch',
              details: `choiceIds length (${body.choiceIds.length}) must match amounts length (${body.amounts.length})`,
            }),
            {
              status: 400,
              headers: corsHeaders,
            }
          );
        }
      }

      // Parse approved choice IDs from environment
      const approvedChoiceIds = parseApprovedChoiceIds(env);

      // Get chain configuration
      const chainId = Number.parseInt(env.CHAIN_ID);
      const chain = getChainConfig(chainId);

      // Validate authorization chain ID matches
      const authChainId =
        typeof body.authorization.chainId === 'string'
          ? Number.parseInt(body.authorization.chainId)
          : body.authorization.chainId;
      if (authChainId !== chainId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Chain ID mismatch',
            details: `Authorization chain ID ${authChainId} does not match relayer chain ID ${chainId}`,
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // Validate authorization contract address matches allowed address
      const allowedAddress = env.ALLOWED_CONTRACT_ADDRESS.toLowerCase() as Address;
      const authAddress = body.authorization.address.toLowerCase() as Address;
      if (authAddress !== allowedAddress) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Contract address not allowed',
            details: `Authorization contract address ${body.authorization.address} does not match allowed address ${env.ALLOWED_CONTRACT_ADDRESS}`,
          }),
          {
            status: 403,
            headers: corsHeaders,
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

      // Create public client for reading blockchain state
      const publicClient = createPublicClient({
        chain,
        transport: http(env.RPC_URL),
      });

      // Convert string values to proper types
      const nonceValue =
        typeof body.authorization.nonce === 'string'
          ? Number.parseInt(body.authorization.nonce)
          : Number(body.authorization.nonce);

      const authorization = {
        address: body.authorization.address,
        chainId: authChainId,
        nonce: nonceValue,
        r: body.authorization.r,
        s: body.authorization.s,
        yParity: body.authorization.yParity,
      };

      // Verify the authorization was signed by the expected address
      // We recover the address from the authorization to ensure it matches what we expect
      let signerAddress: Address;
      try {
        signerAddress = await recoverAuthorizationAddress({
          authorization,
        });
        if (env.ENVIRONMENT !== 'production') {
          // eslint-disable-next-line no-console
          console.log('Authorization verification:', {
            recoveredAddress: signerAddress,
            contractAddress: authorization.address,
          });
        }
      } catch (verifyError) {
        if (env.ENVIRONMENT !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Failed to verify authorization:', verifyError);
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid authorization signature',
            details: 'Could not recover signer from authorization',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // Verify minimum holdings (90+ tokens across wallet + stakes)
      const minimumHoldings = BigInt(env.MINIMUM_HOLDINGS);
      const tokenAddress = env.TOKEN_ADDRESS as Address;
      const stakeChoicesAddress = env.STAKE_CHOICES_ADDRESS as Address;

      try {
        const holdingsCheck = await verifyMinimumHoldings(
          publicClient,
          signerAddress,
          tokenAddress,
          stakeChoicesAddress,
          approvedChoiceIds,
          minimumHoldings
        );

        if (!holdingsCheck.valid) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Insufficient holdings',
              details: {
                message: `Must have at least ${(minimumHoldings / BigInt(10 ** 18)).toString()} tokens`,
                totalHoldings: holdingsCheck.totalHoldings.toString(),
                walletBalance: holdingsCheck.walletBalance.toString(),
                totalStaked: holdingsCheck.totalStaked.toString(),
                minimumRequired: minimumHoldings.toString(),
              },
            }),
            {
              status: 403,
              headers: corsHeaders,
            }
          );
        }

        if (env.ENVIRONMENT !== 'production') {
          // eslint-disable-next-line no-console
          console.log('Holdings verification passed:', {
            totalHoldings: holdingsCheck.totalHoldings.toString(),
            walletBalance: holdingsCheck.walletBalance.toString(),
            totalStaked: holdingsCheck.totalStaked.toString(),
          });
        }
      } catch (holdingsError) {
        if (env.ENVIRONMENT !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Holdings verification failed:', holdingsError);
        }
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Holdings verification failed',
            details: holdingsError instanceof Error ? holdingsError.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: corsHeaders,
          }
        );
      }

      // Parse and validate operation-specific data
      const MAX_STAKE_PER_TX = BigInt('1000000000000000000000'); // 1000 tokens
      const approvedChoiceIdsSet = new Set(approvedChoiceIds.map((id) => id.toString()));

      // Helper function to validate and parse choice IDs
      const validateChoiceIds = (ids: string[]): bigint[] => {
        return ids.map((id) => {
          const choiceId = BigInt(id);
          if (!approvedChoiceIdsSet.has(choiceId.toString())) {
            throw new Error(`Choice ID ${choiceId} is not in the approved list of choices`);
          }
          return choiceId;
        });
      };

      // Helper function to parse amounts
      const parseAmounts = (amts: string[]): bigint[] => {
        return amts.map((amt) => BigInt(amt));
      };

      let callData: Hex;
      let operationDetails: Record<string, unknown> = {};

      try {
        if (body.operation === 'addStakes') {
          const choiceIds = validateChoiceIds(body.choiceIds!);
          const amounts = parseAmounts(body.amounts!);

          // Validate non-zero amounts
          if (!validateNonZeroAmounts(amounts)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Zero amount not allowed',
                details: 'All amounts must be greater than 0',
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          // Validate total amount
          const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);
          if (totalAmount > MAX_STAKE_PER_TX) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Total amount too high',
                details: `Total amount ${totalAmount.toString()} exceeds maximum ${MAX_STAKE_PER_TX.toString()}`,
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          callData = encodeFunctionData({
            abi: STAKER_WALLET_ABI,
            functionName: 'addStakes',
            args: [choiceIds, amounts],
          });

          operationDetails = {
            operation: 'addStakes',
            choiceIds: choiceIds.map((id) => id.toString()),
            amounts: amounts.map((amt) => amt.toString()),
            totalAmount: totalAmount.toString(),
          };
        } else if (body.operation === 'updateStakes') {
          const oldChoiceIds = body.oldChoiceIds ? validateChoiceIds(body.oldChoiceIds) : [];
          const oldAmounts = body.oldAmounts ? parseAmounts(body.oldAmounts) : [];
          const newChoiceIds = validateChoiceIds(body.newChoiceIds!);
          const newAmounts = parseAmounts(body.newAmounts!);

          // Validate non-zero amounts for old stakes if provided
          if (oldAmounts.length > 0 && !validateNonZeroAmounts(oldAmounts)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Zero amount not allowed',
                details: 'All old amounts must be greater than 0',
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          // Validate non-zero amounts for new stakes
          if (!validateNonZeroAmounts(newAmounts)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Zero amount not allowed',
                details: 'All new amounts must be greater than 0',
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          // Validate total new amount
          const totalNewAmount = newAmounts.reduce((sum, amt) => sum + amt, 0n);
          if (totalNewAmount > MAX_STAKE_PER_TX) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Total amount too high',
                details: `Total new amount ${totalNewAmount.toString()} exceeds maximum ${MAX_STAKE_PER_TX.toString()}`,
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          callData = encodeFunctionData({
            abi: STAKER_WALLET_ABI,
            functionName: 'updateStakes',
            args: [oldChoiceIds, oldAmounts, newChoiceIds, newAmounts],
          });

          operationDetails = {
            operation: 'updateStakes',
            oldChoiceIds: oldChoiceIds.map((id) => id.toString()),
            oldAmounts: oldAmounts.map((amt) => amt.toString()),
            newChoiceIds: newChoiceIds.map((id) => id.toString()),
            newAmounts: newAmounts.map((amt) => amt.toString()),
            totalNewAmount: totalNewAmount.toString(),
          };
        } else if (body.operation === 'withdraw') {
          const recipient = body.recipient as Address;

          // Check wallet has balance before calling withdraw
          const walletBalance = (await publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [signerAddress],
          })) as bigint;

          if (walletBalance === 0n) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'No balance to withdraw',
                details: 'Wallet has zero balance',
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          callData = encodeFunctionData({
            abi: STAKER_WALLET_ABI,
            functionName: 'withdraw',
            args: [recipient],
          });

          operationDetails = {
            operation: 'withdraw',
            recipient,
            availableBalance: walletBalance.toString(),
          };
        } else if (body.operation === 'unstakeAllAndWithdraw') {
          const choiceIds = validateChoiceIds(body.choiceIds!);
          const amounts = parseAmounts(body.amounts!);
          const recipient = body.recipient as Address;

          // Validate non-zero amounts
          if (!validateNonZeroAmounts(amounts)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'Zero amount not allowed',
                details: 'All amounts must be greater than 0',
              }),
              {
                status: 400,
                headers: corsHeaders,
              }
            );
          }

          callData = encodeFunctionData({
            abi: STAKER_WALLET_ABI,
            functionName: 'unstakeAllAndWithdraw',
            args: [choiceIds, amounts, recipient],
          });

          const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0n);
          operationDetails = {
            operation: 'unstakeAllAndWithdraw',
            choiceIds: choiceIds.map((id) => id.toString()),
            amounts: amounts.map((amt) => amt.toString()),
            recipient,
            totalAmount: totalAmount.toString(),
          };
        } else {
          // This should never happen due to earlier validation
          throw new Error('Invalid operation');
        }
      } catch (parseError) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation failed',
            details: parseError instanceof Error ? parseError.message : 'Unknown error',
          }),
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      if (env.ENVIRONMENT !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Relaying transaction:', {
          from: account.address,
          to: signerAddress, // Send to the EOA that signed the authorization
          authorizationList: [authorization],
          data: callData,
          operation: body.operation,
          operationDetails,
        });
      }

      // Send the transaction with the authorization
      const txHash = await walletClient.sendTransaction({
        account,
        to: signerAddress, // The EOA that will be delegated
        data: callData,
        value: 0n,
        authorizationList: [authorization],
        chain,
      });

      if (env.ENVIRONMENT !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Transaction sent:', txHash);
      }

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
            ...operationDetails,
          },
        } as RelayResponse),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    } catch (error) {
      if (env.ENVIRONMENT !== 'production') {
        // eslint-disable-next-line no-console
        console.error('Relay error:', error);
      }

      // Extract useful error information
      const err = error as Error & {
        cause?: unknown;
        details?: unknown;
        shortMessage?: string;
        metaMessages?: unknown;
      };

      const errorDetails = {
        message: err.message || 'Unknown error',
        cause: err.cause,
        details: err.details,
        shortMessage: err.shortMessage,
        metaMessages: err.metaMessages,
      };

      return new Response(
        JSON.stringify({
          success: false,
          error: err.shortMessage || err.message || 'Transaction failed',
          details: errorDetails,
        } as RelayResponse),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};
