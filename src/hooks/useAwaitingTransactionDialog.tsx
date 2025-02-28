import { atom, useAtom } from 'jotai';

const awaitingTransactionDialogAtom = atom(false);

export const useAwaitingTransactionDialog = () => {
  return useAtom(awaitingTransactionDialogAtom);
};
