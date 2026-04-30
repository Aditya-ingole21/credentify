// src/context/Web3Context.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../lib/contract';

// ✅ Sepolia Testnet chain ID (11155111 in hex)
const SEPOLIA_CHAIN_ID = "0xaa36a7";

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  contract: ethers.Contract | null;
  isUniversity: boolean;
  isAdmin: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isUniversity, setIsUniversity] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setLoading(true);

      const eth = (window as any).ethereum;
      if (!eth) {
        alert("Please install MetaMask or another Web3 wallet!");
        return;
      }

      // ✅ Switch to Sepolia before doing anything else
      const currentChainId = await eth.request({ method: "eth_chainId" });
      if (currentChainId !== SEPOLIA_CHAIN_ID) {
        try {
          await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // If Sepolia not added to MetaMask, add it
          if (switchError.code === 4902) {
            await eth.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia Testnet",
                nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Request account access - this will trigger MetaMask popup
      const accounts = await eth.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        alert("No accounts found. Please check your wallet.");
        return;
      }

      const provider = new ethers.BrowserProvider(eth);
      const signer = await provider.getSigner();
      
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(accounts[0]);

      // Try to check roles, but handle if contract doesn't exist
      try {
        const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
        // const universityRole = ethers.keccak256(ethers.toUtf8Bytes("UNIVERSITY_ROLE"));

        // const hasUniversityRole = await contract.hasRole(universityRole, accounts[0]);
        const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, accounts[0]);

        // setIsUniversity(hasUniversityRole);
        setIsAdmin(hasAdminRole);

        console.log("Wallet connected:", accounts[0]);
        // console.log("Is University:", hasUniversityRole);
        console.log("Is Admin:", hasAdminRole);
      } catch (roleError: any) {
        console.error("Error checking roles:", roleError);
        console.warn("Contract might not be deployed or address is incorrect");
        
        // Still allow connection but without role checks
        setIsUniversity(false);
        setIsAdmin(false);
        
        
      }

    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      
      // Handle specific errors
      if (error.code === 4001) {
        alert("Connection request rejected. Please approve the connection in your wallet.");
      } else if (error.code === -32002) {
        alert("Connection request already pending. Please check your wallet.");
      } else {
        alert("Failed to connect wallet: " + (error.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setIsUniversity(false);
    setIsAdmin(false);
    console.log("Wallet disconnected");
  };

  // Check if wallet is already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      const eth = (window as any).ethereum;
      if (!eth) return;

      try {
        // Check if already connected (without requesting)
        const accounts = await eth.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.length > 0) {
          // ✅ Check network on auto-reconnect — only connect if already on Sepolia
          const currentChainId = await eth.request({ method: "eth_chainId" });
          if (currentChainId !== SEPOLIA_CHAIN_ID) {
            console.warn("Auto-reconnect skipped: not on Sepolia. Please connect manually.");
            return;
          }

          // Auto-reconnect if previously connected
          const provider = new ethers.BrowserProvider(eth);
          const signer = await provider.getSigner();
          
          

          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

          setProvider(provider);
          setSigner(signer);
          setContract(contract);
          setAccount(accounts[0]);

          // Role checks with error handling
          try {
            const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
            const universityRole = ethers.keccak256(ethers.toUtf8Bytes("UNIVERSITY_ROLE"));

            const hasUniversityRole = await contract.hasRole(universityRole, accounts[0]);
            const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, accounts[0]);

            setIsUniversity(hasUniversityRole);
            setIsAdmin(hasAdminRole);

            console.log("Auto-reconnected to:", accounts[0]);
          } catch (roleError) {
            console.warn("Could not check roles on auto-reconnect");
            setIsUniversity(false);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    };

    checkConnection();
  }, []); // Only run once on mount

  // Listen for account and chain changes
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      
      if (!accounts || accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else if (accounts[0] !== account) {
        // User switched to a different account
        setAccount(accounts[0]);
        
        // Update roles for new account
        if (contract) {
          try {
            const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
            const universityRole = ethers.keccak256(ethers.toUtf8Bytes("UNIVERSITY_ROLE"));

            const hasUniversityRole = await contract.hasRole(universityRole, accounts[0]);
            const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, accounts[0]);

            setIsUniversity(hasUniversityRole);
            setIsAdmin(hasAdminRole);

            console.log("New account roles - University:", hasUniversityRole, "Admin:", hasAdminRole);
          } catch (error) {
            console.error("Error checking roles:", error);
          }
        }
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log("Chain changed to:", chainId);
      // Reload the page when chain changes
      window.location.reload();
    };

    const handleDisconnect = () => {
      console.log("Wallet disconnected");
      disconnectWallet();
    };

    // Add event listeners
    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    eth.on("disconnect", handleDisconnect);

    // Cleanup
    return () => {
      if (eth.removeListener) {
        eth.removeListener("accountsChanged", handleAccountsChanged);
        eth.removeListener("chainChanged", handleChainChanged);
        eth.removeListener("disconnect", handleDisconnect);
      }
    };
  }, [account, contract]); // Add dependencies

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        signer,
        contract,
        isUniversity,
        isAdmin,
        connectWallet,
        disconnectWallet,
        loading,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};

