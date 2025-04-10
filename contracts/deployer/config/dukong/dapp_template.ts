export const deploymentConfig: DeploymentConfig = {
  "name": "dapp_template",
  "network": "dukong",
  "contractWasmPath": "../artifacts/dapp_template.wasm",
  "checksumsPath": "../artifacts/checksums.txt",
  "label": "My Dapp Template",
  "initMsg": {
    "count": 8
  },
  "saveDeployment": true
};

export const migrationConfig: MigrationConfig = {
  "name": "dapp_template",
  "network": "dukong",
  "contractAddress": "mantra15wev5zt4d733d2yskl55vh4a4gutalqdud6h2tygdqtxqh7z87pshu8nxq",
  "contractWasmPath": "../artifacts/dapp_template.wasm",
  "checksumsPath": "../artifacts/checksums.txt",
  "migrateMsg": {},
  "saveMigration": true
}