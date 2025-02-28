const DEFAULT_STARTING_LETTERS_NUMBER = 10;
const DEFAULT_END_LETTERS_NUMBER = 4;

export const shortenAddress = (address: string) => {
  return `${address.slice(0, DEFAULT_STARTING_LETTERS_NUMBER)}...${address.slice(-DEFAULT_END_LETTERS_NUMBER)}`;
};
