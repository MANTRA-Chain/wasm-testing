<!-- CLOUDFLARE_PAGES_BADGE_START -->
[![Cloudflare Pages Deployment](https://img.shields.io/badge/Cloudflare_Pages-deployed-blue.svg)](https://mantra-dapp-dapp-template.pages.dev)
<!-- CLOUDFLARE_PAGES_BADGE_END -->
# MANTRA DAPP TEMPLATE

This repository is a multi-contract decentralized application template that includes smart contracts and a frontend. It is designed to help you quickly develop and deploy your dapp.

## Overview

- **Smart Contracts:** Find the main contract projects under the [`contracts/`](contracts/) directory. The primary smart contract project is in [`contracts/dapp-template/`](contracts/dapp-template/).
- **Frontend:** The frontend resides in the `webapp/` directory (if present). Refer to its README for setup instructions.
- **Automation & Tasks:** Custom tasks are managed in the [`xtask/`](xtask/) directory.
- **Scripts:** Use the scripts in the [`scripts/`](scripts/) directory to automate builds, schema generation, and artifact management.

## Deployment & Development

### How Your App Gets Deployed

When you create a repository from this template, the following happens automatically:

1. **First Commit Trigger**: On your first commit, GitHub Actions automatically sets up your deployment infrastructure
2. **Cloudflare Pages Setup**: Your frontend in the `webapp/` folder is automatically deployed to Cloudflare Pages
3. **Continuous Deployment**: Every push to the `main` branch triggers a new deployment
4. **Preview Deployments**: Pull requests get their own preview URLs for testing
5. **Deployment Confirmation**: When the GitHub Actions workflow completes successfully (green checkmark ✅), your app is deployed and live

Your app will be available at: `https://mantra-dapp-[your-repo-name].pages.dev`

### What You Need to Configure

#### 📦 Package Manager (Required)

Your `webapp/package.json` must specify an exact package manager version:

```json
{
  "packageManager": "npm@10.2.0"  // ✅ Fixed version required
}
```

**Important**: Only fixed versions are supported. Ranges like `^10.2.0` or `~10.2.0` will cause deployment to fail.

#### 🟢 Node.js Version (Required)

Specify your Node.js version in `webapp/package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"  // ✅ Fixed version required
  }
}
```

#### 🔧 Environment Variables (Optional)

Configure environment variables in `.github/settings.json`:

```json
{
  "environment": {
    "preview": {
      "NEXT_PUBLIC_API_URL": "https://api-staging.example.com"
    },
    "production": {
      "NEXT_PUBLIC_API_URL": "https://api.example.com"
    }
  }
}
```

**⚠️ Important Limitations:**
- **Create/Update Only**: Environment variables can only be created or updated through this configuration
- **No Deletion**: Removing variables from `settings.json` won't delete them from Cloudflare
- **To Delete Variables**: Contact the DevOps team for manual deletion

#### 🔐 Secrets Management (Important)

**Never store secrets in your repository!** This includes:
- API keys
- Database credentials  
- Private tokens
- Any sensitive configuration

**Why?** Even in private repositories:
- Git history permanently records all changes
- Anyone with repo access can see all historical values
- Leaked secrets in commits are difficult to fully remove

**How to add secrets:**
1. Contact the DevOps team
2. They will securely add your secrets directly in Cloudflare
3. Reference them in your code using environment variables

### Development Workflow (webapp)

Since this is a monorepo, these steps apply specifically to the `webapp/` directory:

1. **Local Development**: Work in the `webapp/` directory as usual
2. **Testing**: Your changes are automatically deployed to preview URLs when you create PRs
3. **Production**: Merging to `main` automatically deploys to production

### Deployment Status

After deployment, a badge will be added to your README showing the deployment status. You can click it to view your live app.

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
