import { MantraChain, MantraProvider } from '@mantrachain/connect';
import type { Preview } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import '../src/index.css';

const WALLET_CONNECT_OPTIONS = {
  signClient: {
    projectId: '85c30f9b79cfd167f2c526fd0d5ab731',
    relayUrl: 'wss://relay.walletconnect.org',
    metadata: {
      name: 'dapp-template',
      description: '',
      url: 'https://mantra.zone/',
      icons: [
        'https://raw.githubusercontent.com/cosmology-tech/cosmos-kit/main/packages/docs/public/favicon-96x96.png',
      ],
    },
  },
};

const queryClient = new QueryClient();

const decorators = [
  (Story) => {
    return (
      <QueryClientProvider client={queryClient}>
        <MantraProvider
          chainName={MantraChain.Testnet}
          walletConnectOptions={WALLET_CONNECT_OPTIONS}
        >
          <Story />
        </MantraProvider>
      </QueryClientProvider>
    );
  },
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators,
};

export default preview;
