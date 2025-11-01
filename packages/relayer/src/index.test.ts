import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Address, Hex } from 'viem';
import worker, { type Env } from './index';

// Mock viem modules
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    createWalletClient: vi.fn(() => ({
      sendTransaction: vi.fn(() => Promise.resolve('0xmocktxhash' as Hex)),
    })),
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn(() => Promise.resolve(100n * 10n ** 18n)), // 100 tokens
    })),
  };
});

vi.mock('viem/accounts', async () => {
  const actual = await vi.importActual('viem/accounts');
  return {
    ...actual,
    privateKeyToAccount: vi.fn(() => ({
      address: '0xRELAYER' as Address,
    })),
  };
});

vi.mock('viem/experimental', async () => {
  const actual = await vi.importActual('viem/experimental');
  return {
    ...actual,
    recoverAuthorizationAddress: vi.fn(() =>
      Promise.resolve('0xUSER' as Address)
    ),
  };
});

// Test environment configuration
const mockEnv: Env = {
  PRIVATE_KEY: '0x' + '1'.repeat(64),
  RPC_URL: 'https://sepolia.optimism.io',
  CHAIN_ID: '11155420',
  ALLOWED_CONTRACT_ADDRESS: '0xSTAKERWALLET',
  APPROVED_CHOICE_IDS: '1,2,3',
  TOKEN_ADDRESS: '0xTOKEN',
  STAKE_CHOICES_ADDRESS: '0xSTAKECHOICES',
  MINIMUM_HOLDINGS: '90000000000000000000', // 90 tokens
  ENVIRONMENT: 'test',
};

// Helper to create valid authorization
const createValidAuth = () => ({
  address: '0xSTAKERWALLET' as Address,
  chainId: 11155420,
  nonce: 0,
  r: '0x' + '2'.repeat(64) as Hex,
  s: '0x' + '3'.repeat(64) as Hex,
  yParity: 0,
});

// Helper to create request
const createRequest = (body: unknown) =>
  new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('Relayer Request Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Method Validation', () => {
    test('rejects GET requests', async () => {
      const request = new Request('http://localhost', { method: 'GET' });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(405);
      expect(json).toMatchObject({
        success: false,
        error: 'Method not allowed',
      });
    });

    test('handles OPTIONS preflight', async () => {
      const request = new Request('http://localhost', { method: 'OPTIONS' });
      const response = await worker.fetch(request, mockEnv);

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('Required Field Validation', () => {
    test('rejects missing authorization', async () => {
      const request = createRequest({ operation: 'addStakes' });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields',
      });
    });

    test('rejects missing operation', async () => {
      const request = createRequest({ authorization: createValidAuth() });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields',
      });
    });
  });

  describe('Operation Type Validation', () => {
    test('rejects invalid operation type', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'invalidOperation',
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Invalid operation',
      });
    });

    test('accepts valid operation types', async () => {
      const validOps = ['addStakes', 'updateStakes', 'withdraw', 'unstakeAllAndWithdraw'];

      for (const op of validOps) {
        const body: { authorization: unknown; operation: string; [key: string]: unknown } = {
          authorization: createValidAuth(),
          operation: op,
        };

        // Add required fields for each operation
        if (op === 'addStakes') {
          body.choiceIds = ['1'];
          body.amounts = ['1000000000000000000'];
        } else if (op === 'updateStakes') {
          body.newChoiceIds = ['1'];
          body.newAmounts = ['1000000000000000000'];
        } else if (op === 'withdraw') {
          body.recipient = '0xRECIPIENT';
        } else if (op === 'unstakeAllAndWithdraw') {
          body.choiceIds = ['1'];
          body.amounts = ['1000000000000000000'];
          body.recipient = '0xRECIPIENT';
        }

        const request = createRequest(body);
        const response = await worker.fetch(request, mockEnv);
        const json = await response.json();

        // Should not fail on operation type validation
        expect(json.error).not.toBe('Invalid operation');
      }
    });
  });

  describe('addStakes Validation', () => {
    test('rejects missing choiceIds', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for addStakes',
      });
    });

    test('rejects missing amounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['1'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for addStakes',
      });
    });

    test('rejects array length mismatch', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['1', '2'],
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Array length mismatch',
      });
    });

    test('rejects empty arrays', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: [],
        amounts: [],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Empty arrays',
      });
    });

    test('rejects non-approved choice IDs', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['999'], // Not in approved list (1,2,3)
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Validation failed',
      });
      expect(json.details).toContain('not in the approved list');
    });

    test('rejects zero amounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['1'],
        amounts: ['0'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Zero amount not allowed',
      });
    });

    test('rejects amounts exceeding MAX_STAKE_PER_TX', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['1'],
        amounts: ['1000000000000000000001'], // 1000 + 1 wei
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Total amount too high',
      });
    });
  });

  describe('updateStakes Validation', () => {
    test('rejects missing newChoiceIds', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        newAmounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for updateStakes',
      });
    });

    test('rejects missing newAmounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        newChoiceIds: ['1'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for updateStakes',
      });
    });

    test('rejects new array length mismatch', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        newChoiceIds: ['1', '2'],
        newAmounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Array length mismatch',
      });
    });

    test('rejects old array length mismatch', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        oldChoiceIds: ['1', '2'],
        oldAmounts: ['1000000000000000000'],
        newChoiceIds: ['1'],
        newAmounts: ['2000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Array length mismatch',
      });
    });

    test('rejects zero new amounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        newChoiceIds: ['1'],
        newAmounts: ['0'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Zero amount not allowed',
      });
    });

    test('rejects zero old amounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        oldChoiceIds: ['1'],
        oldAmounts: ['0'],
        newChoiceIds: ['2'],
        newAmounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Zero amount not allowed',
      });
    });

    test('rejects new amounts exceeding MAX_STAKE_PER_TX', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'updateStakes',
        newChoiceIds: ['1'],
        newAmounts: ['1000000000000000000001'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Total amount too high',
      });
    });
  });

  describe('withdraw Validation', () => {
    test('rejects missing recipient', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'withdraw',
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for withdraw',
      });
    });
  });

  describe('unstakeAllAndWithdraw Validation', () => {
    test('rejects missing recipient', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'unstakeAllAndWithdraw',
        choiceIds: ['1'],
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for unstakeAllAndWithdraw',
      });
    });

    test('rejects missing choiceIds', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'unstakeAllAndWithdraw',
        amounts: ['1000000000000000000'],
        recipient: '0xRECIPIENT',
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for unstakeAllAndWithdraw',
      });
    });

    test('rejects missing amounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'unstakeAllAndWithdraw',
        choiceIds: ['1'],
        recipient: '0xRECIPIENT',
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Missing required fields for unstakeAllAndWithdraw',
      });
    });

    test('rejects array length mismatch', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'unstakeAllAndWithdraw',
        choiceIds: ['1', '2'],
        amounts: ['1000000000000000000'],
        recipient: '0xRECIPIENT',
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Array length mismatch',
      });
    });

    test('rejects zero amounts', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'unstakeAllAndWithdraw',
        choiceIds: ['1'],
        amounts: ['0'],
        recipient: '0xRECIPIENT',
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Zero amount not allowed',
      });
    });
  });

  describe('Authorization Validation', () => {
    test('rejects chain ID mismatch', async () => {
      const auth = createValidAuth();
      auth.chainId = 1; // Mainnet instead of OP Sepolia

      const request = createRequest({
        authorization: auth,
        operation: 'addStakes',
        choiceIds: ['1'],
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toMatchObject({
        success: false,
        error: 'Chain ID mismatch',
      });
    });

    test('rejects contract address mismatch', async () => {
      const auth = createValidAuth();
      auth.address = '0xWRONGADDRESS' as Address;

      const request = createRequest({
        authorization: auth,
        operation: 'addStakes',
        choiceIds: ['1'],
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json).toMatchObject({
        success: false,
        error: 'Contract address not allowed',
      });
    });
  });

  describe('Environment Configuration', () => {
    test('parses approved choice IDs correctly', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['2'], // Should be in approved list
        amounts: ['1000000000000000000'],
      });
      const response = await worker.fetch(request, mockEnv);
      const json = await response.json();

      // Should succeed since choice ID is in approved list
      expect(json.success).toBe(true);
      expect(json.txHash).toBe('0xmocktxhash');
    });

    test('handles invalid APPROVED_CHOICE_IDS configuration', async () => {
      const badEnv = { ...mockEnv, APPROVED_CHOICE_IDS: 'not,valid,numbers' };

      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'addStakes',
        choiceIds: ['1'],
        amounts: ['1000000000000000000'],
      });

      const response = await worker.fetch(request, badEnv);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
    });

    test('rejects unsupported chain ID', async () => {
      const badEnv = { ...mockEnv, CHAIN_ID: '1' }; // Ethereum mainnet

      const auth = createValidAuth();
      auth.chainId = 1;

      const request = createRequest({
        authorization: auth,
        operation: 'addStakes',
        choiceIds: ['1'],
        amounts: ['1000000000000000000'],
      });

      const response = await worker.fetch(request, badEnv);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.details.message).toContain('Unsupported chain ID');
    });
  });

  describe('CORS Headers', () => {
    test('includes CORS headers in all responses', async () => {
      const request = createRequest({
        authorization: createValidAuth(),
        operation: 'invalidOp',
      });
      const response = await worker.fetch(request, mockEnv);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});
