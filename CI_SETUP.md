# CI Setup with GitHub Secrets

This document explains how to set up the CI testing environment using GitHub secrets for secure wallet management.

## Overview

The `test_ci.sh` script has been enhanced to support importing wallets from seed phrases stored as GitHub secrets. This eliminates the need to hardcode wallet addresses or manage keys manually in CI environments.

## Features

- **Secure Seed Phrase Import**: Automatically imports wallets from GitHub secrets
- **Dual Wallet Derivation**: Derives both primary (index 0) and secondary (index 1) wallets from the same seed phrase
- **Automatic Wallet Funding**: Funds the secondary wallet for testing scenarios
- **Automatic Cleanup**: Removes imported keys after tests complete
- **Backward Compatibility**: Still supports manual wallet specification via `-w` parameter
- **Enhanced Security**: Uses test keyring backend for CI environments

## Setup Instructions

### 1. Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret`
4. Name: `SEED_PHRASE`
5. Value: Your 12 or 24-word seed phrase (e.g., `word1 word2 word3 ... word12`)
6. Click `Add secret`

### 2. Configure GitHub Actions Workflow

Create or update your `.github/workflows/test-contracts.yml` file:

```yaml
name: Test Smart Contracts

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-contracts:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Install dependencies
      run: |
        # Install Rust, just, and other dependencies
        # ... your setup steps here ...

    - name: Download blockchain binary
      run: |
        # Download and install your blockchain binary
        # Example for mantrachaind:
        wget https://github.com/MANTRA-Finance/mantrachain/releases/download/v3.0.0/mantrachaind-3.0.0-linux-amd64.tar.gz
        tar -xzf mantrachaind-3.0.0-linux-amd64.tar.gz
        sudo mv mantrachaind /usr/local/bin/
        chmod +x /usr/local/bin/mantrachaind

    - name: Run contract tests
      env:
        SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
        DEBUG: 1  # Optional: Enable debug logging
      run: |
        chmod +x scripts/test_ci.sh
        ./scripts/test_ci.sh \
          -r "https://rpc.testnet.mantrachain.io:443" \
          -c "mantra-hongbai-1" \
          -d "uom" \
          -b "mantrachaind"
```

## Usage

### With Seed Phrase (Recommended for CI)

```bash
# Set the seed phrase as an environment variable
export SEED_PHRASE="your twelve word seed phrase goes here like this example"

# Run the script without specifying a wallet
./scripts/test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY>
```

### With Manual Wallet (Local Development)

```bash
# Run with a specific wallet address
./scripts/test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET>
```

## Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `-r` | RPC endpoint URL | Yes | `https://rpc.testnet.mantrachain.io:443` |
| `-c` | Chain ID | Yes | `mantra-hongbai-1` |
| `-d` | Native token denomination | Yes | `uom` |
| `-b` | Blockchain binary name | Yes | `mantrachaind` |
| `-w` | Wallet address (optional if SEED_PHRASE is set) | No | `mantra1abc...` |

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SEED_PHRASE` | 12 or 24-word mnemonic seed phrase | Yes (if `-w` not provided) | `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about` |
| `DEBUG` | Enable debug logging (optional) | No | `1` |

## Security Features

### Automatic Key Cleanup

The script automatically removes imported keys when it exits (successful or failed):

```bash
# Cleanup function removes imported wallet
cleanup_wallet() {
    if [ "$CLEANUP_WALLET" = true ] && [ -n "$IMPORTED_WALLET" ]; then
        log_info "Cleaning up imported wallet: $IMPORTED_WALLET"
        $BINARY keys delete $IMPORTED_WALLET --keyring-backend test -y 2>/dev/null || true
    fi
}

# Trap ensures cleanup happens on script exit
trap cleanup_wallet EXIT
```

### Test Keyring Backend

All operations use the `--keyring-backend test` flag, which:
- Stores keys in memory/temporary files
- Doesn't require password prompts
- Is suitable for CI environments
- Automatically cleans up on system restart

## Wallet Management

### Dual Wallet System

The script now automatically derives two wallets from the same seed phrase:

1. **Primary Wallet (Index 0)**: Used for main contract interactions and funding
2. **Secondary Wallet (Index 1)**: Used for unauthorized access tests and cross-wallet transactions

### Import Process

1. Script checks if `WALLET` parameter is provided
2. If not, checks for `SEED_PHRASE` environment variable
3. Creates primary wallet with timestamp: `ci-test-wallet-1699123456`
4. Creates secondary wallet with timestamp: `ci-test-wallet2-1699123456`
5. Imports primary wallet: `echo "$SEED_PHRASE" | $BINARY keys add $WALLET --recover --keyring-backend test`
6. Imports secondary wallet: `echo "$SEED_PHRASE" | $BINARY keys add $WALLET2 --recover --keyring-backend test --account 1`
7. Funds secondary wallet from primary wallet for testing
8. Uses both wallets for comprehensive testing scenarios

### Cleanup Process

1. Trap function registered on script start
2. Executes on script exit (success, failure, or interruption)
3. Removes primary wallet: `$BINARY keys delete $WALLET --keyring-backend test -y`
4. Removes secondary wallet: `$BINARY keys delete $WALLET2 --keyring-backend test -y`

### Wallet Funding

When using seed phrase derivation:
- Primary wallet must have sufficient initial funds
- Secondary wallet is automatically funded with 200uom from primary wallet
- Additional funding transactions are performed during testing as needed

## Testing the Setup

### Local Testing

```bash
# Test with your seed phrase locally
export SEED_PHRASE="your seed phrase here"
./scripts/test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY>
```

### Verify Import

```bash
# After import, you can verify the wallet exists
$BINARY keys list --keyring-backend test
```

## Troubleshooting

### Common Issues

1. **Invalid Seed Phrase**
   ```
   Error: Failed to import wallet from seed phrase
   ```
   - Verify your seed phrase is correct (12 or 24 words)
   - Check for extra spaces or special characters

2. **Missing Binary**
   ```
   Error: command not found: mantrachaind
   ```
   - Ensure blockchain binary is installed and in PATH
   - Check binary name matches the `-b` parameter

3. **Network Connection**
   ```
   Error: connection refused
   ```
   - Verify RPC endpoint is accessible
   - Check network connectivity

4. **Insufficient Funds**
   ```
   Error: insufficient funds
   ```
   - Ensure primary wallet (index 0) has enough tokens for testing
   - Check wallet address derivation from seed phrase
   - Verify secondary wallet funding succeeded
   - Primary wallet needs at least 500uom for full test suite

### Debug Mode

Enable debug logging for troubleshooting:

```bash
export DEBUG=1
./scripts/test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY>
```

## Best Practices

### Security

1. **Never commit seed phrases** to version control
2. **Use repository secrets** for sensitive data
3. **Limit secret access** to necessary workflows only
4. **Rotate secrets regularly** if compromised
5. **Fund test wallets minimally** - only provide enough tokens for testing
6. **Use testnet seed phrases** - never use mainnet seed phrases for CI

### CI/CD

1. **Use dedicated test wallets** with minimal funds
2. **Test on testnets** before mainnet deployment
3. **Cache dependencies** to improve build times
4. **Set appropriate timeouts** for network operations

### Monitoring

1. **Monitor primary wallet balance** to ensure adequate funds (minimum 500uom recommended)
2. **Set up alerts** for CI failures
3. **Review logs regularly** for security issues
4. **Track gas usage** for cost optimization
5. **Verify dual wallet derivation** works correctly with your seed phrase
6. **Test wallet funding** logic in development before production use

## Example Networks

### MANTRA Testnet

```bash
./scripts/test_ci.sh \
  -r "https://rpc.testnet.mantrachain.io:443" \
  -c "mantra-hongbai-1" \
  -d "uom" \
  -b "mantrachaind"
```

### Custom Network

```bash
./scripts/test_ci.sh \
  -r "https://your-rpc-endpoint.com:443" \
  -c "your-chain-id" \
  -d "your-denom" \
  -b "your-binary"
```

## Cross-Repository Usage

If you have the test scripts in a separate repository (e.g., `wasm-testing`) and want to invoke them from your main repository (e.g., `mantrachaind`), here are several approaches:

### Option 1: Multiple Repository Checkout (Recommended)

Create a workflow in your `mantrachaind` repository that checks out both repos:

```yaml
# .github/workflows/test-contracts.yml in mantrachaind repository
name: Test Smart Contracts

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-contracts:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout mantrachaind
      uses: actions/checkout@v4
      with:
        path: mantrachaind

    - name: Checkout wasm-testing
      uses: actions/checkout@v4
      with:
        repository: your-org/wasm-testing  # Replace with your repo
        path: wasm-testing
        token: ${{ secrets.GITHUB_TOKEN }}

    - name: Install dependencies
      run: |
        # Install Rust and other dependencies
        curl --proto '=https' --tlsv1.2 -sSf https://rustup.rs/ | sh -s -- -y
        source ~/.cargo/env
        rustup target add wasm32-unknown-unknown
        
        # Install just
        curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

    - name: Build mantrachaind
      run: |
        cd mantrachaind
        make build
        sudo cp build/mantrachaind /usr/local/bin/
        chmod +x /usr/local/bin/mantrachaind

    - name: Run contract tests
      env:
        SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
        DEBUG: 1
      run: |
        cd wasm-testing
        chmod +x scripts/test_ci.sh
        ./scripts/test_ci.sh \
          -r "https://rpc.testnet.mantrachain.io:443" \
          -c "mantra-hongbai-1" \
          -d "uom" \
          -b "mantrachaind"
```

### Option 2: Git Submodules

Add the testing repository as a submodule:

```bash
# From your mantrachaind repository
git submodule add https://github.com/your-org/wasm-testing.git testing
git commit -m "Add wasm-testing as submodule"
```

Then create a workflow:

```yaml
# .github/workflows/test-contracts.yml in mantrachaind repository
name: Test Smart Contracts

on:
  push:
    branches: [ main, develop ]

jobs:
  test-contracts:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout with submodules
      uses: actions/checkout@v4
      with:
        submodules: recursive

    - name: Build mantrachaind
      run: |
        make build
        sudo cp build/mantrachaind /usr/local/bin/

    - name: Run tests
      env:
        SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
      run: |
        cd testing
        chmod +x scripts/test_ci.sh
        ./scripts/test_ci.sh \
          -r "https://rpc.testnet.mantrachain.io:443" \
          -c "mantra-hongbai-1" \
          -d "uom" \
          -b "mantrachaind"
```

### Option 3: Copy Scripts to Main Repository

Copy the test scripts directly to your `mantrachaind` repository:

```bash
# From your mantrachaind repository
mkdir -p scripts
cp /path/to/wasm-testing/scripts/test_ci.sh scripts/
cp /path/to/wasm-testing/scripts/set_txflag.sh scripts/
```

Then create a simple workflow:

```yaml
# .github/workflows/test-contracts.yml in mantrachaind repository
name: Test Smart Contracts

on:
  push:
    branches: [ main, develop ]

jobs:
  test-contracts:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Build mantrachaind
      run: |
        make build
        sudo cp build/mantrachaind /usr/local/bin/

    - name: Checkout test contracts
      uses: actions/checkout@v4
      with:
        repository: your-org/wasm-testing
        path: contracts
        sparse-checkout: |
          contracts
          artifacts
          justfile
          Cargo.toml

    - name: Run tests
      env:
        SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
      run: |
        # Copy necessary files for compilation
        cd contracts
        just optimize
        cd ..
        
        # Run tests with locally built binary
        chmod +x scripts/test_ci.sh
        ./scripts/test_ci.sh \
          -r "https://rpc.testnet.mantrachain.io:443" \
          -c "mantra-hongbai-1" \
          -d "uom" \
          -b "mantrachaind"
```

### Option 4: Reusable Workflow

Create a reusable workflow in your `wasm-testing` repository:

```yaml
# .github/workflows/reusable-test.yml in wasm-testing repository
name: Reusable Contract Test

on:
  workflow_call:
    inputs:
      rpc:
        required: true
        type: string
      chain_id:
        required: true
        type: string
      denom:
        required: true
        type: string
      binary:
        required: true
        type: string
      binary_path:
        required: false
        type: string
        default: "/usr/local/bin"
    secrets:
      SEED_PHRASE:
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout wasm-testing
      uses: actions/checkout@v4

    - name: Install dependencies
      run: |
        curl --proto '=https' --tlsv1.2 -sSf https://rustup.rs/ | sh -s -- -y
        source ~/.cargo/env
        rustup target add wasm32-unknown-unknown
        curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

    - name: Run tests
      env:
        SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
        PATH: ${{ inputs.binary_path }}:${{ env.PATH }}
      run: |
        chmod +x scripts/test_ci.sh
        ./scripts/test_ci.sh \
          -r "${{ inputs.rpc }}" \
          -c "${{ inputs.chain_id }}" \
          -d "${{ inputs.denom }}" \
          -b "${{ inputs.binary }}"
```

Then use it from your `mantrachaind` repository:

```yaml
# .github/workflows/test-contracts.yml in mantrachaind repository
name: Test Smart Contracts

on:
  push:
    branches: [ main, develop ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Build mantrachaind
      run: |
        make build
        sudo cp build/mantrachaind /usr/local/bin/

  test-contracts:
    needs: build
    uses: your-org/wasm-testing/.github/workflows/reusable-test.yml@main
    with:
      rpc: "https://rpc.testnet.mantrachain.io:443"
      chain_id: "mantra-hongbai-1"
      denom: "uom"
      binary: "mantrachaind"
    secrets:
      SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
```

### Option 5: Remote Script Execution

Execute the script directly from the remote repository:

```yaml
# .github/workflows/test-contracts.yml in mantrachaind repository
name: Test Smart Contracts

on:
  push:
    branches: [ main, develop ]

jobs:
  test-contracts:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Build mantrachaind
      run: |
        make build
        sudo cp build/mantrachaind /usr/local/bin/

    - name: Download and run test script
      env:
        SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
      run: |
        # Download test scripts
        curl -O https://raw.githubusercontent.com/your-org/wasm-testing/main/scripts/test_ci.sh
        curl -O https://raw.githubusercontent.com/your-org/wasm-testing/main/scripts/set_txflag.sh
        
        # Download contracts and setup
        git clone https://github.com/your-org/wasm-testing.git temp-contracts
        cd temp-contracts
        
        # Install dependencies and compile
        curl --proto '=https' --tlsv1.2 -sSf https://rustup.rs/ | sh -s -- -y
        source ~/.cargo/env
        rustup target add wasm32-unknown-unknown
        curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin
        just optimize
        
        # Run tests
        chmod +x ../test_ci.sh
        mkdir -p ../scripts
        cp ../set_txflag.sh ../scripts/
        ../test_ci.sh \
          -r "https://rpc.testnet.mantrachain.io:443" \
          -c "mantra-hongbai-1" \
          -d "uom" \
          -b "mantrachaind"
```

## Recommendation

**Option 1 (Multiple Repository Checkout)** is recommended because it:
- Keeps repositories separate and focused
- Provides full access to both codebases
- Is easy to maintain and update
- Works well with GitHub's checkout action
- Allows for independent versioning

**Option 4 (Reusable Workflow)** is best if you want to:
- Share the testing workflow across multiple repositories
- Centralize testing logic
- Provide a clean API for testing

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GitHub Actions logs for detailed error messages
3. Verify network connectivity and binary installation
4. Ensure seed phrase and wallet have sufficient funds