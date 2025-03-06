import { Coin } from '@cosmjs/amino';
import { MsgExecuteContractEncodeObject } from '@cosmjs/cosmwasm-stargate';
import { toUtf8 } from '@cosmjs/encoding';

export const createTypedMessage = ({
  sender,
  contract,
  msg,
  funds,
}: {
  sender: string;
  contract: string;
  msg: object;
  funds: Coin[];
}): MsgExecuteContractEncodeObject => {
  return {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: {
      sender,
      contract,
      msg: toUtf8(JSON.stringify(msg)),
      funds: funds,
    },
  };
};

export const createIncreateAllowanceMessage = ({
  sender,
  contract,
  amount,
  spender,
}: {
  sender: string;
  contract: string;
  amount: string;
  spender: string;
}): MsgExecuteContractEncodeObject => {
  return {
    typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
    value: {
      sender,
      contract,
      msg: toUtf8(
        JSON.stringify({
          increase_allowance: {
            amount,
            spender,
          },
        }),
      ),
      funds: [],
    },
  };
};
