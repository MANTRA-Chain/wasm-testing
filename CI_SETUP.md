# CI Setup with GitHub Secrets

This document explains how to set up the CI testing environment using GitHub secrets for secure wallet management.

## Overview

The `test_ci.sh` script has been enhanced to support importing wallets from seed phrases stored as GitHub secrets. This eliminates the need to hardcode wallet addresses or manage keys manually in CI environments.

## Features

- **Secure Seed Phrase Import**: Automatically imports wallets from GitHub secrets
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

### Import Process

1. Script checks if `WALLET` parameter is provided
2. If not, checks for `SEED_PHRASE` environment variable
3. Creates temporary wallet with timestamp: `ci-test-wallet-1699123456`
4. Imports seed phrase using: `echo "$SEED_PHRASE" | $BINARY keys add $WALLET --recover --keyring-backend test`
5. Uses imported wallet for all transactions

### Cleanup Process

1. Trap function registered on script start
2. Executes on script exit (success, failure, or interruption)
3. Removes imported wallet: `$BINARY keys delete $WALLET --keyring-backend test -y`

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
   - Ensure wallet has enough tokens for testing
   - Check wallet address derivation from seed phrase

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

### CI/CD

1. **Use dedicated test wallets** with minimal funds
2. **Test on testnets** before mainnet deployment
3. **Cache dependencies** to improve build times
4. **Set appropriate timeouts** for network operations

### Monitoring

1. **Monitor test wallet balances** to ensure adequate funds
2. **Set up alerts** for CI failures
3. **Review logs regularly** for security issues
4. **Track gas usage** for cost optimization

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

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review GitHub Actions logs for detailed error messages
3. Verify network connectivity and binary installation
4. Ensure seed phrase and wallet have sufficient funds