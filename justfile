# Justfile
# Make sure you have `just` installed: https://github.com/casey/just

set dotenv-load

# Prints the list of recipes.
default:
  @just --list

# Builds the whole project.
build:
  cargo build

# Build all schemas
schemas:
  scripts/build_schemas.sh

# Tests the whole project.
test:
  cargo test

# Alias to the format recipe.
fmt:
  @just format

# Formats the rust, toml and sh files in the project.
format:
  cargo fmt --all
  find . -type f -iname "*.toml" -print0 | xargs -0 taplo format
  find . -type f -name '*.sh' -exec shfmt -w {} \;

# Runs clippy with the a feature flag if provided.
lint:
  cargo clippy --all -- -D warnings

# Tries to fix clippy issues automatically.
lintfix:
  cargo clippy --fix --allow-staged --allow-dirty --all-features
  just format

# Checks the whole project with all the feature flags.
check-all:
  cargo check --all-features

# Cargo check.
check:
  cargo check

# Cargo clean and update.
refresh:
  cargo clean && cargo update

# Cargo watch.
watch:
  cargo watch -x check

# Watches tests.
watch-test:
  cargo watch -x "nextest run"

# Compiles and optimizes the contracts.
optimize:
  scripts/build_release.sh

# Prints the artifacts versions on the current commit.
get-artifacts-versions:
  scripts/get_artifacts_versions.sh --skip-verbose

# Prints the artifacts size. Optimize should be called before.
get-artifacts-size:
  scripts/check_artifacts_size.sh

# Stores artifacts on chain.
store ARTIFACT='':
  @scripts/store_artifact.sh {{ARTIFACT}}

# Instantiates contracts.
instantiate code_id instantiate_msg label *args:
  @scripts/instantiate_contract.sh \
    -c {{code_id}} \
    -i '{{instantiate_msg}}' \
    -l {{label}} {{args}}


# Tests contracts on chain.
test-on-chain RPC CHAIN_ID DENOM BINARY WALLET WALLET2:
  @scripts/test.sh -r {{RPC}} -c {{CHAIN_ID}} -d {{DENOM}} -b {{BINARY}} -w {{WALLET}} -W {{WALLET2}}

# Tests contracts on chain with CI-grade error handling.
test-on-chain-ci RPC CHAIN_ID DENOM BINARY WALLET WALLET2:
  @scripts/test_ci.sh -r {{RPC}} -c {{CHAIN_ID}} -d {{DENOM}} -b {{BINARY}} -w {{WALLET}}
