# Testing Documentation

This document describes the testing approach for the WASM contracts in this project, including both local development testing and CI/CD integration testing.

## Overview

We have two main test scripts:

1. **`scripts/test.sh`** - Original test script for manual testing
2. **`scripts/test_ci.sh`** - Enhanced test script with robust error handling for CI environments

## Key Improvements in CI Script

### Transaction Verification
- **Transaction Success Checking**: Every transaction is verified to complete successfully
- **Timeout Handling**: Transactions have configurable timeouts (default: 60 seconds)
- **Error Propagation**: Script exits immediately on unexpected failures
- **Expected Failures**: Distinguishes between expected failures and actual errors

### Enhanced Error Handling
- **Exit on Error**: Uses `set -e` to exit on any command failure
- **Colored Output**: Uses color-coded logging for better visibility
- **Detailed Error Messages**: Provides specific error context and transaction hashes
- **JSON Parsing**: Robust parsing of transaction results and error codes

### CI/CD Integration
- **GitHub Actions Workflow**: Automated testing on push/PR
- **Multi-network Support**: Can test against different networks
- **Artifact Management**: Uploads test artifacts on failure
- **Balance Verification**: Checks wallet balance before running tests

## Test Categories

### 1. Contract Upload Tests
- Compiles contracts using `just optimize`
- Uploads WASM files to the blockchain
- Verifies code IDs are generated correctly
- Tests upload permissions

### 2. Contract Instantiation Tests
- Instantiates contracts with valid parameters
- Tests instantiation with unauthorized wallets (should fail)
- Verifies contract addresses are generated

### 3. Contract Execution Tests
- **Successful Executions**:
  - `modify_state` - Basic state modification
  - `send_funds` - Transfer funds with proper amount
  - `call_contract` - Inter-contract calls with/without reply
  - `fill_map` - Bulk data operations with reasonable limits
  - `delete_entry_on_map` - Data deletion operations

- **Expected Failures**:
  - `send_funds` without required funds
  - `fill_map` with excessive limits (gas limit exceeded)
  - Invalid message formats

### 4. Contract Query Tests
- **Smart Queries**:
  - `get_count` - Simple state queries
  - `iterate_over_map` - Pagination testing with various limits
  - `get_entry_from_map` - Specific data retrieval

- **Raw Queries**:
  - Direct state access using base64 encoded keys

### 5. Contract Migration Tests
- Successful migration by contract admin
- Failed migration by unauthorized wallet
- Verification of migration completion

### 6. Native Module Integration Tests
- Bank module interactions (token transfers)
- Cross-module functionality testing

## Running Tests

### Local Development

```bash
# Basic test (original script)
just test-on-chain <RPC> <CHAIN_ID> <DENOM> <BINARY> <WALLET>

# CI-grade test (enhanced script)
just test-on-chain-ci <RPC> <CHAIN_ID> <DENOM> <BINARY> <WALLET>

# Example for testnet
just test-on-chain-ci \
  https://rpc.testnet.mantrachain.io:443 \
  mantra-hongbai-1 \
  uom \
  mantrad \
  my-test-wallet
```

### Manual Script Execution

```bash
# Make script executable
chmod +x scripts/test_ci.sh

# Run with parameters
./scripts/test_ci.sh \
  -r https://rpc.testnet.mantrachain.io:443 \
  -c mantra-hongbai-1 \
  -d uom \
  -b mantrad \
  -w my-test-wallet
```

### CI/CD (GitHub Actions)

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch (with custom parameters)

## Prerequisites

### Local Environment
- Rust toolchain with `wasm32-unknown-unknown` target
- `just` command runner
- `jq` for JSON processing
- Blockchain binary (e.g., `mantrad`)
- Test wallet with sufficient funds

### CI Environment
- Configured via GitHub Actions workflow
- Requires secrets for test wallet mnemonic
- Automatic dependency installation and caching

## Test Wallet Requirements

Your test wallet needs:
- At least 1 OM (1,000,000 uom) for transaction fees
- Proper permissions for contract operations
- Access to the target network

## Configuration

### Network Settings
Default configuration for testnet in CI:
```bash
RPC="https://rpc.testnet.mantrachain.io:443"
CHAIN_ID="mantra-hongbai-1"  
DENOM="uom"
BINARY="mantrad"
```

### GitHub Secrets Required
- `TEST_WALLET_MNEMONIC`: Mnemonic phrase for test wallet

## Troubleshooting

### Common Issues

1. **Transaction Timeouts**
   - Increase timeout in `wait_for_tx` function
   - Check network connectivity and RPC endpoint

2. **Insufficient Funds**
   - Verify wallet balance before running tests
   - Fund test wallet with required amount

3. **Permission Denied**
   - Ensure wallet has proper permissions
   - Check contract admin settings

4. **Contract Compilation Failures**
   - Verify Rust toolchain setup
   - Check for syntax errors in contracts
   - Ensure all dependencies are available

### Debugging Tips

1. **Enable Verbose Logging**
   ```bash
   export RUST_LOG=debug
   ```

2. **Check Transaction Details**
   ```bash
   mantrad q tx <TX_HASH> --node <RPC> -o json | jq '.'
   ```

3. **Verify Contract State**
   ```bash
   mantrad q wasm contract-state smart <CONTRACT_ADDR> '{"get_count":{}}' --node <RPC>
   ```

## Success Criteria

A successful test run should:
- ✅ Compile all contracts without errors
- ✅ Upload all contracts and receive valid code IDs
- ✅ Instantiate contracts successfully
- ✅ Execute all expected-success transactions
- ✅ Verify all expected-failure transactions actually fail
- ✅ Complete all queries without errors
- ✅ Successfully migrate contracts
- ✅ Complete native module interactions

## Contributing

When adding new tests:
1. Follow the existing pattern of success verification
2. Distinguish between expected and unexpected failures
3. Add appropriate logging messages
4. Update this documentation with new test cases
5. Test locally before submitting PR

For questions or issues, please open a GitHub issue with:
- Test script output
- Network configuration used
- Wallet address and balance
- Specific error messages