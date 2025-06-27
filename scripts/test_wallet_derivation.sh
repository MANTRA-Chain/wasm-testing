#!/usr/bin/env bash
#
# Test script to verify dual wallet derivation from seed phrase
# This script helps verify that the wallet derivation logic works correctly
# before running the full CI test suite.
#
# Usage:
#   SEED_PHRASE="your seed phrase" ./test_wallet_derivation.sh <BINARY>
#   OR
#   ./test_wallet_derivation.sh <BINARY> -s "your seed phrase"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to get wallet address from key name
get_wallet_address() {
    local key_name="$1"
    $BINARY keys show $key_name --keyring-backend test -a 2>/dev/null
}

# Parse command line arguments
SEED_PHRASE_ARG=""
BINARY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--seed-phrase)
            SEED_PHRASE_ARG="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 <BINARY> [-s|--seed-phrase \"seed phrase\"]"
            echo "       SEED_PHRASE=\"seed phrase\" $0 <BINARY>"
            echo ""
            echo "Test dual wallet derivation from seed phrase"
            echo ""
            echo "Options:"
            echo "  -s, --seed-phrase    Seed phrase to test with"
            echo "  -h, --help          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 mantrachaind -s \"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about\""
            echo "  SEED_PHRASE=\"abandon abandon...\" $0 mantrachaind"
            exit 0
            ;;
        *)
            if [ -z "$BINARY" ]; then
                BINARY="$1"
            else
                log_error "Unknown argument: $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Use seed phrase from argument or environment variable
if [ -n "$SEED_PHRASE_ARG" ]; then
    SEED_PHRASE="$SEED_PHRASE_ARG"
fi

# Validate inputs
if [ -z "$BINARY" ]; then
    log_error "Binary name is required"
    echo "Usage: $0 <BINARY> [-s|--seed-phrase \"seed phrase\"]"
    exit 1
fi

if [ -z "$SEED_PHRASE" ]; then
    log_error "Seed phrase is required"
    echo "Set SEED_PHRASE environment variable or use -s option"
    exit 1
fi

# Check if binary exists
if ! command -v "$BINARY" &> /dev/null; then
    log_error "Binary '$BINARY' not found in PATH"
    exit 1
fi

log_info "Testing dual wallet derivation with binary: $BINARY"
log_info "Seed phrase length: $(echo "$SEED_PHRASE" | wc -w) words"

# Generate unique wallet names
TIMESTAMP=$(date +%s)
TEST_WALLET1="test-wallet-${TIMESTAMP}"
TEST_WALLET2="test-wallet2-${TIMESTAMP}"

# Cleanup function
cleanup_test_wallets() {
    log_info "Cleaning up test wallets..."
    if [ -n "$TEST_WALLET1" ]; then
        $BINARY keys delete $TEST_WALLET1 --keyring-backend test -y 2>/dev/null || true
    fi
    if [ -n "$TEST_WALLET2" ]; then
        $BINARY keys delete $TEST_WALLET2 --keyring-backend test -y 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup_test_wallets EXIT

log_info "Importing primary wallet (index 0): $TEST_WALLET1"
echo "$SEED_PHRASE" | $BINARY keys add $TEST_WALLET1 --recover --keyring-backend test
if [ $? -ne 0 ]; then
    log_error "Failed to import primary wallet"
    exit 1
fi

log_info "Importing secondary wallet (index 1): $TEST_WALLET2"
echo "$SEED_PHRASE" | $BINARY keys add $TEST_WALLET2 --recover --keyring-backend test --account 1
if [ $? -ne 0 ]; then
    log_error "Failed to import secondary wallet"
    exit 1
fi

# Get wallet addresses
WALLET1_ADDRESS=$(get_wallet_address $TEST_WALLET1)
WALLET2_ADDRESS=$(get_wallet_address $TEST_WALLET2)

if [ -z "$WALLET1_ADDRESS" ]; then
    log_error "Failed to get primary wallet address"
    exit 1
fi

if [ -z "$WALLET2_ADDRESS" ]; then
    log_error "Failed to get secondary wallet address"
    exit 1
fi

log_info "✓ Primary wallet successfully imported"
log_info "  Name: $TEST_WALLET1"
log_info "  Address: $WALLET1_ADDRESS"

log_info "✓ Secondary wallet successfully imported"
log_info "  Name: $TEST_WALLET2"
log_info "  Address: $WALLET2_ADDRESS"

# Verify addresses are different
if [ "$WALLET1_ADDRESS" = "$WALLET2_ADDRESS" ]; then
    log_error "Primary and secondary wallets have the same address!"
    log_error "This indicates an issue with account index derivation"
    exit 1
fi

log_info "✓ Wallet addresses are different (correct derivation)"

# List all test wallets
log_info "All test wallets in keyring:"
$BINARY keys list --keyring-backend test | grep -E "(test-wallet.*${TIMESTAMP}|Address)" || true

# Test basic wallet operations
log_info "Testing wallet operations..."

# Test showing wallet info
log_debug "Primary wallet info:"
$BINARY keys show $TEST_WALLET1 --keyring-backend test

log_debug "Secondary wallet info:"
$BINARY keys show $TEST_WALLET2 --keyring-backend test

log_info "✓ All wallet operations successful"

# Summary
echo ""
log_info "=== WALLET DERIVATION TEST SUMMARY ==="
log_info "✓ Binary: $BINARY"
log_info "✓ Seed phrase: $(echo "$SEED_PHRASE" | wc -w) words"
log_info "✓ Primary wallet (index 0): $WALLET1_ADDRESS"
log_info "✓ Secondary wallet (index 1): $WALLET2_ADDRESS"
log_info "✓ Addresses are unique: $([ "$WALLET1_ADDRESS" != "$WALLET2_ADDRESS" ] && echo "YES" || echo "NO")"
log_info "✓ Wallet derivation test completed successfully!"

echo ""
log_info "You can now use these addresses for testing:"
echo "export PRIMARY_WALLET_ADDRESS=\"$WALLET1_ADDRESS\""
echo "export SECONDARY_WALLET_ADDRESS=\"$WALLET2_ADDRESS\""

echo ""
log_info "To run the full CI test suite:"
echo "SEED_PHRASE=\"$SEED_PHRASE\" ./scripts/test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b $BINARY"
