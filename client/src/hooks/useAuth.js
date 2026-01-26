import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

const getPrimaryWallet = (wallets) => {
  if (!wallets || wallets.length === 0) {
    return null;
  }

  return wallets.find((wallet) => wallet.chainType === "ethereum") || wallets[0];
};

export const useAuth = () => {
  const { user, authenticated, ready, login, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();

  const smartWalletAccount = user?.linkedAccounts?.find(
    (account) => account.type === "smart_wallet"
  );

  return {
    user,
    isAuthenticated: authenticated,
    isLoading: !ready,
    login,
    logout,
    getAccessToken,
    wallets,
    primaryWallet: getPrimaryWallet(wallets),
    smartWalletClient,
    smartWalletAddress: smartWalletAccount?.address || null,
  };
};

export default useAuth;
