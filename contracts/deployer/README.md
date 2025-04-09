# Contract Deployer

This project provides a script to deploy CosmWasm smart contracts to the Mantra blockchain.

## Prerequisites

1. **Node.js**: Ensure you have Node.js installed.
2. **Yarn**: Install Yarn package manager.
3. **Environment Variables**: Create a `.env` file in the root directory with the following content:
   ```properties
   MNEMONIC="your mnemonic phrase here"
   ```

## Deployment Configuration

Deployment configurations are stored in the `config` directory. Each configuration file specifies the deployment parameters, such as the network, contract name, and initialization message.

Example configuration for `dukong` network:
```typescript
export const deploymentConfig: DeploymentConfig = {
  name: "dapp_template",
  network: "dukong",
  contractWasmPath: "../artifacts/dapp_template.wasm",
  initMsg: {
    count: 8
  },
  saveDeployment: true
};
```

## How to Deploy

1. **Install Dependencies**:
   Run the following command to install all required dependencies:
   ```bash
   yarn install
   ```

2. **Run the Deployment Script**:
   Use the `yarn deploy` script to deploy your contract. Provide the path to the deployment configuration file as an argument.

   Example:
   ```bash
   yarn deploy ./config/dukong/dapp_template.ts
   ```

3. **Deployment Output**:
   After running the script, the deployment information will be displayed in the console, including:
   - Contract address
   - Transaction hash
   - Code ID

   If `saveDeployment` is set to `true` in the configuration, the deployment details will be saved to a JSON file in the `deployment/<network>` directory.

   Example output:
   ```
   Contract uploaded with Code ID: 689
   Contract instantiated at address: mantra1nqshj50wtyrmnhkgexd0f9t4n2kgy6eh7r8qwuwhnpkrf56s0jeqm89wkj
   TransactionHash: 49C2FBF0FC5007AA957CB883F99FB199C0EBCA69032EC52EA6AE6E8740E3012B
   View transaction: https://www.mintscan.io/mantra-testnet/tx/49C2FBF0FC5007AA957CB883F99FB199C0EBCA69032EC52EA6AE6E8740E3012B
   Deployment info saved to deployment/dukong/dapp_template.json
   ```

## Notes

- Ensure the `MNEMONIC` environment variable is set correctly in the `.env` file.
- The `contractWasmPath` in the configuration must point to the compiled `.wasm` file of your contract.
- The `network` field in the configuration must match one of the supported networks (`dukong` or `mainnet`).
