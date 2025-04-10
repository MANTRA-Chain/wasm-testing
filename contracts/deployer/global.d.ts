declare interface DeploymentConfig {
  name: string;
  network: 'dukong' | 'mainnet';
  contractWasmPath: string;
  checksumsPath: string;
  initMsg: Record<string, any>;
  label: string;
  memo?: string;
  funds?: {
    denom: string;
    amount: string;
  }[];
  admin?: string;
  saveDeployment: boolean;
}

declare interface MigrationConfig {
  name: string;
  network: 'dukong' | 'mainnet';
  contractAddress: string;
  contractWasmPath: string;
  checksumsPath: string;
  migrateMsg: Record<string, any>;
  memo?: string;
  saveMigration: boolean;
}

declare interface ConfigImport {
  deploymentConfig?: DeploymentConfig;
  migrationConfig?: MigrationConfig;
}