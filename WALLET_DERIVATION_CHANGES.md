# Wallet Derivation Changes Summary

## Overview

The `test_ci.sh` script has been enhanced to support dual wallet derivation from a single seed phrase. This eliminates the need for hardcoded secondary wallet addresses and improves security and flexibility in CI environments.

## Key Changes

### 1. Dual Wallet Import System

**Before:**
- Single wallet import from seed phrase
- Hardcoded secondary wallet: `mantra127hgjjrst9mngejd4l4wprnnppwl6e223vm9g6`

**After:**
- Primary wallet derived from seed phrase (index 0)
- Secondary wallet derived from same seed phrase (index 1)
- Both wallets imported automatically when using `SEED_PHRASE`

### 2. Enhanced Wallet Management

#### Import Process
```bash
# Primary wallet (index 0)
echo "$SEED_PHRASE" | $BINARY keys add $IMPORTED_WALLET --recover --keyring-backend test

# Secondary wallet (index 1)  
echo "$SEED_PHRASE" | $BINARY keys add $IMPORTED_WALLET2 --recover --keyring-backend test --account 1
```

#### Automatic Funding
- Secondary wallet is automatically funded with 200uom from primary wallet
- Ensures secondary wallet has sufficient funds for testing scenarios
- Funding transaction is verified before proceeding

#### Address Resolution
- New `get_wallet_address()` function retrieves actual addresses from key names
- Improves reliability when using wallet addresses in transactions
- Better error handling and logging

### 3. Improved Cleanup

**Enhanced cleanup function:**
```bash
cleanup_wallet() {
    if [ "$CLEANUP_WALLET" = true ]; then
        if [ -n "$IMPORTED_WALLET" ]; then
            log_info "Cleaning up imported primary wallet: $IMPORTED_WALLET"
            $BINARY keys delete $IMPORTED_WALLET --keyring-backend test -y 2>/dev/null || true
        fi
        if [ -n "$IMPORTED_WALLET2" ]; then
            log_info "Cleaning up imported secondary wallet: $IMPORTED_WALLET2"
            $BINARY keys delete $IMPORTED_WALLET2 --keyring-backend test -y 2>/dev/null || true
        fi
    fi
}
```

## Usage Changes

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `SEED_PHRASE` | 12 or 24-word mnemonic | Yes (if `-w` not provided) | `abandon abandon abandon...` |

### Script Behavior

1. **With Seed Phrase Only:**
   ```bash
   SEED_PHRASE="your seed phrase" ./test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY>
   ```
   - Derives primary wallet (index 0) for main operations
   - Derives secondary wallet (index 1) for unauthorized tests
   - Funds secondary wallet automatically

2. **With Manual Wallet (Backward Compatible):**
   ```bash
   ./test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET>
   ```
   - Uses provided wallet for main operations
   - Falls back to hardcoded secondary wallet

## Testing Scenarios Enhanced

### Unauthorized Access Tests
- Uses derived secondary wallet instead of hardcoded address
- More realistic testing as both wallets are derived from same mnemonic
- Better represents real-world usage patterns

### Cross-Wallet Transactions
- Bank transfers between primary and secondary wallets
- Contract interactions from different wallet contexts
- Migration attempts with unauthorized wallets

## Security Improvements

### 1. No Hardcoded Addresses
- Eliminates hardcoded wallet addresses in test scenarios
- Reduces maintenance when changing test networks
- Improves portability across different environments

### 2. Controlled Key Derivation
- Uses deterministic derivation from single seed phrase
- Easier to manage and secure single secret
- Consistent wallet addresses across test runs

### 3. Enhanced Cleanup
- Removes both imported wallets on script exit
- Prevents key accumulation in CI environments
- Reduces security risk from leftover test keys

## Wallet Derivation Test Script

A new utility script `test_wallet_derivation.sh` has been added:

### Purpose
- Verify dual wallet derivation works correctly
- Test wallet operations before running full CI suite
- Debug seed phrase and binary compatibility

### Usage
```bash
# Test with environment variable
SEED_PHRASE="your seed phrase" ./scripts/test_wallet_derivation.sh mantrachaind

# Test with command line argument
./scripts/test_wallet_derivation.sh mantrachaind -s "your seed phrase"
```

### Output
```
[INFO] Testing dual wallet derivation with binary: mantrachaind
[INFO] ✓ Primary wallet successfully imported
[INFO]   Name: test-wallet-1699123456
[INFO]   Address: mantra1abc...
[INFO] ✓ Secondary wallet successfully imported  
[INFO]   Name: test-wallet2-1699123456
[INFO]   Address: mantra1def...
[INFO] ✓ Wallet addresses are different (correct derivation)
```

## Funding Requirements

### Primary Wallet (Index 0)
- **Minimum recommended:** 500uom
- **Used for:**
  - Contract uploads and instantiations
  - Main contract interactions
  - Funding secondary wallet (200uom)
  - Bank transfer tests

### Secondary Wallet (Index 1)
- **Automatically funded:** 200uom (from primary)
- **Additional funding:** 100uom (during bank tests)
- **Used for:**
  - Unauthorized access attempts
  - Cross-wallet transactions
  - Migration failure tests

## Compatibility

### Backward Compatibility
- Existing workflows using `-w` parameter continue to work
- Hardcoded secondary wallet still used when manual wallet specified
- No breaking changes to existing CI configurations

### New Workflows
- Can omit `-w` parameter when using `SEED_PHRASE`
- Automatically handles dual wallet setup
- Simplified configuration for new projects

## Error Handling

### Enhanced Error Messages
```bash
[ERROR] Failed to import primary wallet from seed phrase
[ERROR] Failed to import secondary wallet from seed phrase  
[WARN] Failed to fund secondary wallet - some tests may fail
```

### Graceful Degradation
- If secondary wallet funding fails, tests continue with warnings
- Cleanup still occurs even if some operations fail
- Better logging for troubleshooting issues

## Migration Guide

### For Existing CI Setups

1. **No changes required** if using manual wallet (`-w` parameter)
2. **To use new dual derivation:**
   - Remove `-w` parameter from script invocation
   - Ensure `SEED_PHRASE` secret is set
   - Verify primary wallet has sufficient funds (500uom recommended)

### For New CI Setups

1. Set `SEED_PHRASE` as GitHub secret
2. Fund primary wallet (index 0) with minimum 500uom
3. Run script without `-w` parameter
4. Script handles all wallet management automatically

## Benefits

1. **Security:** Single secret to manage instead of multiple wallet addresses
2. **Flexibility:** Works across different networks without hardcoded addresses  
3. **Reliability:** Deterministic wallet derivation ensures consistent behavior
4. **Maintainability:** Reduces hardcoded values and network-specific configurations
5. **Testing:** More realistic multi-wallet scenarios
6. **Automation:** Fully automated wallet setup and cleanup

## Files Modified

- `scripts/test_ci.sh` - Main testing script with dual wallet support
- `scripts/set_txflag.sh` - Added keyring backend flag
- `CI_SETUP.md` - Updated documentation
- `scripts/test_wallet_derivation.sh` - New utility script (created)

## Example Seed Phrases for Testing

**⚠️ WARNING: Only use these for testnet development!**

```bash
# 12-word example (testnet only)
export SEED_PHRASE="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

# 24-word example (testnet only)  
export SEED_PHRASE="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
```

## Next Steps

1. Test the enhanced script with your seed phrase
2. Update CI workflows to use new dual wallet system
3. Verify wallet funding and derivation work correctly
4. Monitor CI runs for any issues with the new setup
5. Consider using the test derivation script for troubleshooting