### [15:08] [testing] Relayer unit testing strategy with Vitest
**Details**: The EIP-7702 relayer uses unit tests with stubbed blockchain interactions rather than full integration tests. Key decisions:

**Test Strategy:**
- Stub viem client methods (createWalletClient, createPublicClient, recoverAuthorizationAddress)
- Mock balance checks to return 100 tokens
- Mock transaction submission to return '0xmocktxhash'
- Focus on request validation logic, not viem internals or actual blockchain behavior

**What We Test:**
- HTTP method validation (POST only, OPTIONS preflight, CORS)
- Required field validation for all 4 operations
- Array length matching
- Choice ID whitelisting against APPROVED_CHOICE_IDS
- Zero amount rejection
- MAX_STAKE_PER_TX enforcement
- Chain ID and contract address authorization validation

**What We Don't Test:**
- Actual EIP-7702 delegation (can't simulate in tests, requires real chain)
- Signature verification correctness (viem handles this)
- Real balance checking (mocked)
- Transaction execution (mocked)

**Rationale:**
- Fast execution (~50ms for 32 tests)
- No RPC/network dependency = deterministic, CI-friendly
- Catches validation bugs without integration test overhead
- EIP-7702 can't be fully tested locally anyway (Foundry doesn't support it)

**Test Suite Coverage:** 32 tests across HTTP, validation, operations, auth, and config
**Files**: packages/relayer/src/index.test.ts, packages/relayer/vitest.config.ts, packages/relayer/TEST_README.md
---

