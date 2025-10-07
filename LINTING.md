# Linting Setup

This project uses state-of-the-art linting tools for both TypeScript/JavaScript and Solidity code.

## Relayer (TypeScript)

### Tools
- **ESLint** with TypeScript support
- Strict rules for type safety and code quality

### Usage
```bash
cd packages/relayer
npm run lint          # Run linter
npm run lint:fix      # Auto-fix issues
```

### Configuration
- Config file: `packages/relayer/eslint.config.js`
- Uses `@typescript-eslint` plugin with recommended rules
- Custom rules:
  - No explicit `any` types (error)
  - Explicit function return types (warning)
  - No unused variables (error, allows `_` prefix)
  - No console logs (warning)

## Contracts (Solidity)

### Tools
1. **Solhint** - Style guide and basic security linting
2. **Slither** - Advanced static analysis and vulnerability detection
3. **Forge fmt** - Code formatting

### Installation

#### Solhint
```bash
npm install -g solhint
```

#### Slither
```bash
pip3 install slither-analyzer
```

### Usage

#### Quick Commands (using Makefile)
```bash
cd packages/contracts

# Lint with Solhint
make lint

# Run Slither analysis
make slither

# Format code
make format

# Check formatting
make format-check

# Run all checks (format + lint)
make check
```

#### Direct Commands
```bash
# Solhint
solhint 'src/**/*.sol' 'script/**/*.sol' 'test/**/*.sol'

# Slither
slither .

# Forge format
forge fmt
forge fmt --check  # Check only, don't modify
```

### Configuration Files

#### Solhint
- Config: `packages/contracts/.solhint.json`
- Ignore: `packages/contracts/.solhintignore`
- Rules include:
  - Compiler version enforcement (^0.8.0)
  - Naming conventions (camelCase, snake_case)
  - Security checks (reentrancy, low-level calls)
  - Code complexity limits
  - Gas optimization warnings

#### Slither
- Config: `packages/contracts/slither.config.json`
- Detects:
  - Security vulnerabilities
  - Code optimization opportunities
  - Best practice violations
  - Potential bugs

## CI/CD Integration

### GitHub Actions Example
```yaml
# For Relayer
- name: Lint Relayer
  run: |
    cd packages/relayer
    npm run lint

# For Contracts
- name: Lint Contracts
  run: |
    cd packages/contracts
    make check
    make slither
```

## Recommended Workflow

1. **Before committing:**
   ```bash
   # Relayer
   cd packages/relayer && npm run lint:fix

   # Contracts
   cd packages/contracts && make format && make lint
   ```

2. **Before deploying contracts:**
   ```bash
   cd packages/contracts
   make slither  # Run comprehensive security analysis
   ```

3. **Regular audits:**
   - Run Slither periodically for security updates
   - Review warnings and address high/medium severity issues

## Tool Comparison

### Solhint vs Slither

**Solhint** (Fast, CI/CD friendly):
- ✅ Style guide compliance
- ✅ Basic security validation
- ✅ 2-4x faster than alternatives
- ✅ Easy to integrate in development workflow

**Slither** (Comprehensive, Security-focused):
- ✅ Advanced vulnerability detection
- ✅ Code optimization suggestions
- ✅ Control flow visualization
- ✅ Low false positive rate
- ✅ API for custom analysis

**Best Practice**: Use both tools together - Solhint for daily development, Slither for security audits.
