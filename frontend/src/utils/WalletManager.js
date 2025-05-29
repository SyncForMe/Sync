// Real Wallet Integration System
import { ethers } from 'ethers';

class WalletManager {
  constructor() {
    this.connectedWallet = null;
    this.provider = null;
    this.signer = null;
    this.userAddress = null;
    this.chainId = null;
    this.supportedChains = {
      1: { name: 'Ethereum', rpc: 'https://mainnet.infura.io/v3/', currency: 'ETH' },
      137: { name: 'Polygon', rpc: 'https://polygon-rpc.com/', currency: 'MATIC' },
      42161: { name: 'Arbitrum', rpc: 'https://arb1.arbitrum.io/rpc', currency: 'ETH' },
      10: { name: 'Optimism', rpc: 'https://mainnet.optimism.io', currency: 'ETH' },
      56: { name: 'BSC', rpc: 'https://bsc-dataseed.binance.org/', currency: 'BNB' },
      250: { name: 'Fantom', rpc: 'https://rpc.ftm.tools/', currency: 'FTM' },
      43114: { name: 'Avalanche', rpc: 'https://api.avax.network/ext/bc/C/rpc', currency: 'AVAX' }
    };
  }

  // Connect MetaMask Wallet
  async connectMetaMask() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your MetaMask wallet.');
      }

      // Set up provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.userAddress = accounts[0];
      
      // Get current chain ID
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;

      this.connectedWallet = 'MetaMask';

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else {
          this.userAddress = accounts[0];
          this.onAccountChange?.(accounts[0]);
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', (chainId) => {
        this.chainId = parseInt(chainId, 16);
        this.onChainChange?.(this.chainId);
      });

      return {
        success: true,
        address: this.userAddress,
        chainId: this.chainId,
        wallet: 'MetaMask'
      };

    } catch (error) {
      console.error('MetaMask connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Connect Phantom Wallet (Solana)
  async connectPhantom() {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Phantom wallet not installed. Please install Phantom to continue.');
      }

      const response = await window.solana.connect({ onlyIfTrusted: false });
      
      this.userAddress = response.publicKey.toString();
      this.connectedWallet = 'Phantom';
      this.chainId = 'solana';

      // Listen for account changes
      window.solana.on('accountChanged', (publicKey) => {
        if (publicKey) {
          this.userAddress = publicKey.toString();
          this.onAccountChange?.(this.userAddress);
        } else {
          this.disconnect();
        }
      });

      return {
        success: true,
        address: this.userAddress,
        chainId: 'solana',
        wallet: 'Phantom'
      };

    } catch (error) {
      console.error('Phantom connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Connect Coinbase Wallet
  async connectCoinbase() {
    try {
      if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
        throw new Error('Coinbase Wallet not detected. Please install Coinbase Wallet extension.');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.userAddress = accounts[0];
      
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;
      this.connectedWallet = 'Coinbase';

      return {
        success: true,
        address: this.userAddress,
        chainId: this.chainId,
        wallet: 'Coinbase'
      };

    } catch (error) {
      console.error('Coinbase connection error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Switch to a specific chain
  async switchChain(chainId) {
    try {
      if (this.connectedWallet === 'Phantom') {
        throw new Error('Chain switching not available for Solana. Please use an EVM wallet.');
      }

      const chainIdHex = `0x${chainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });

      this.chainId = chainId;
      return { success: true };

    } catch (error) {
      // If chain doesn't exist, try to add it
      if (error.code === 4902) {
        return await this.addChain(chainId);
      }
      
      console.error('Chain switch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Add a new chain to wallet
  async addChain(chainId) {
    try {
      const chainConfig = this.supportedChains[chainId];
      if (!chainConfig) {
        throw new Error('Unsupported chain');
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${chainId.toString(16)}`,
          chainName: chainConfig.name,
          rpcUrls: [chainConfig.rpc],
          nativeCurrency: {
            name: chainConfig.currency,
            symbol: chainConfig.currency,
            decimals: 18
          }
        }]
      });

      this.chainId = chainId;
      return { success: true };

    } catch (error) {
      console.error('Add chain error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get wallet balance
  async getBalance() {
    try {
      if (!this.provider || !this.userAddress) {
        throw new Error('Wallet not connected');
      }

      const balance = await this.provider.getBalance(this.userAddress);
      return {
        success: true,
        balance: ethers.utils.formatEther(balance)
      };

    } catch (error) {
      console.error('Balance fetch error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign a message
  async signMessage(message) {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      const signature = await this.signer.signMessage(message);
      return {
        success: true,
        signature
      };

    } catch (error) {
      console.error('Message signing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect wallet
  disconnect() {
    this.connectedWallet = null;
    this.provider = null;
    this.signer = null;
    this.userAddress = null;
    this.chainId = null;
    this.onDisconnect?.();
  }

  // Check if wallet is connected
  isConnected() {
    return !!this.connectedWallet && !!this.userAddress;
  }

  // Get connection info
  getConnectionInfo() {
    return {
      wallet: this.connectedWallet,
      address: this.userAddress,
      chainId: this.chainId,
      isConnected: this.isConnected()
    };
  }

  // Set event handlers
  setEventHandlers({ onAccountChange, onChainChange, onDisconnect }) {
    this.onAccountChange = onAccountChange;
    this.onChainChange = onChainChange;
    this.onDisconnect = onDisconnect;
  }
}

export default WalletManager;