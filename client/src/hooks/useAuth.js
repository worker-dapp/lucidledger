import { usePrivy, useWallets, useLinkAccount, useUpdateAccount } from "@privy-io/react-auth";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";

const getPrimaryWallet = (wallets) => {
  if (!wallets || wallets.length === 0) {
    return null;
  }

  return wallets.find((wallet) => wallet.chainType === "ethereum") || wallets[0];
};

export const useAuth = (linkCallbacks, updateCallbacks) => {
  const { user, authenticated, ready, login, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();
  const { linkEmail, linkPhone } = useLinkAccount(linkCallbacks);
  const { updateEmail, updatePhone } = useUpdateAccount(updateCallbacks);

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
    linkEmail,
    linkPhone,
    updateEmail,
    updatePhone,
  };
};

export default useAuth;
