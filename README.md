# MANTRA DAPP TEMPLATE

This repository is a multi-contract decentralized application template that includes smart contracts and a frontend. It is designed to help you quickly develop and deploy your dapp.

## Overview

- **Smart Contracts:** Find the main contract projects under the [`contracts/`](contracts/) directory. The primary smart contract project is in [`contracts/dapp-template/`](contracts/dapp-template/).
- **Frontend:** The frontend resides in the `webapp/` directory (if present). Refer to its README for setup instructions.
- **Automation & Tasks:** Custom tasks are managed in the [`xtask/`](xtask/) directory.
- **Scripts:** Use the scripts in the [`scripts/`](scripts/) directory to automate builds, schema generation, and artifact management.

## Project Structure

```
.
├── Cargo.lock
├── Cargo.toml
├── contracts/
│   ├── README.md                # Smart contract overview and instructions
│   └── dapp-template/           # Main smart contract project
│       ├── Cargo.lock
│       ├── Cargo.toml
│       ├── src/                 # Contract source code
│       ├── tests/               # Contract tests
│       └── ...                  # Additional configuration & artifacts
├── artifacts/                   # Build outputs and artifacts
├── scripts/                     # Helper scripts for builds and checks
│   ├── build_release.sh
│   ├── build_schemas.sh
│   ├── check_artifacts_size.sh
│   └── get_artifacts_versions.sh
├── xtask/                       # Custom task runner for extended build tasks
│   └── src/
├── ...                          # Other configuration files (justfile, taplo.toml, etc.)
```

## Getting Started

### Prerequisites

- [Rust and Cargo](https://www.rust-lang.org/tools/install) installed.
- For WebAssembly targets, you may need [wasm-pack](https://rustwasm.github.io/wasm-pack/).

### Building and Testing

#### Smart Contracts

To build the contracts in release mode, run:

```sh
./scripts/build_release.sh
```

To run tests for the smart contracts, navigate to the [`contracts/dapp-template/`](contracts/dapp-template/) directory and execute:

```sh
cargo test
```

#### Automation with xtask

Custom build and maintenance tasks are available in the [`xtask/`](xtask/) directory. These can help streamline the development workflow.

### Managing Artifacts

Artifacts for builds are stored in the [`artifacts/`](artifacts/) folder. Use additional scripts like [`check_artifacts_size.sh`](scripts/check_artifacts_size.sh) to monitor their size and integrity.

## Frontend Setup

If a frontend exists under the `webapp/` directory, follow its specific README instructions to set up, build, and deploy the web application.

## Additional Resources

- Detailed smart contract instructions can be found in [`contracts/README.md`](contracts/README.md).
- Custom tasks and scripts to support your development process are located in [`xtask/`](xtask/) and [`scripts/`](scripts/).

Happy coding and enjoy building your decentralized app!