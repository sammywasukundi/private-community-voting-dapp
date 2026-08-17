export interface WalletCardProps {
  isConnected: boolean;
  isConnecting: boolean;
  walletName: string | null;
  walletAddress: string | null;
  networkId: string | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  nightBalance: bigint | null;
  isRefreshingBalance: boolean;
  onRefreshBalance: () => void;
}
