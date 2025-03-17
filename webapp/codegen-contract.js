import codegen from '@cosmwasm/ts-codegen';

codegen
  .default({
    contracts: [
      {
        name: 'dapp-template',
        dir: 'contracts/dapp-template/schema',
      },
    ],
    outPath: 'src/__generated__/contracts',

    // options are completely optional ;)
    options: {
      bundle: {
        bundleFile: 'index.ts',
        scope: 'contracts',
      },
      types: {
        enabled: true,
      },
      client: {
        enabled: true,
      },
      // reactQuery: {
      //   enabled: true,
      //   optionalClient: true,
      //   version: 'v4',
      //   mutations: true,
      //   queryKeys: true,
      //   queryFactory: true,
      // },
      messageComposer: {
        enabled: true,
      },
      messageBuilder: {
        enabled: true,
      },
      // useContractsHook: {
      //   enabled: true,
      // },
    },
  })
  .then(() => {
    console.log('✨ all done!');
  });
