import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Portfolio from './components/Portfolio';
import RealTimeUpdates from './components/RealTimeUpdates';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com';

// Main App Component
function App() {
  const [currentSection, setCurrentSection] = useState('landing');
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [supportedChains, setSupportedChains] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchSupportedChains();
    fetchPlatformStats();
  }, []);

  const fetchSupportedChains = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chains`);
      const data = await response.json();
      setSupportedChains(data.chains || []);
    } catch (error) {
      console.error('Error fetching chains:', error);
    }
  };

  const fetchPlatformStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stats`);
      const data = await response.json();
      setPlatformStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const connectWallet = async (walletType) => {
    setIsLoading(true);
    try {
      if (walletType === 'metamask' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletConnected(true);
        setConnectedWallet('MetaMask');
        setUserAddress(accounts[0]);
      } else if (walletType === 'phantom' && window.solana) {
        const response = await window.solana.connect();
        setWalletConnected(true);
        setConnectedWallet('Phantom');
        setUserAddress(response.publicKey.toString());
      } else {
        // Demo mode
        setWalletConnected(true);
        setConnectedWallet('Demo Wallet');
        setUserAddress('demo_address_123');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
    setIsLoading(false);
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setConnectedWallet(null);
    setUserAddress('');
  };

  return (
    <div className="App">
      <Navigation 
        currentSection={currentSection} 
        setCurrentSection={setCurrentSection}
        walletConnected={walletConnected}
        connectedWallet={connectedWallet}
        disconnectWallet={disconnectWallet}
      />
      
      {currentSection === 'landing' && (
        <LandingPage 
          setCurrentSection={setCurrentSection}
          platformStats={platformStats}
          supportedChains={supportedChains}
          connectWallet={connectWallet}
          isLoading={isLoading}
        />
      )}
      
      {currentSection === 'swap' && (
        <SwapInterface 
          walletConnected={walletConnected}
          userAddress={userAddress}
          supportedChains={supportedChains}
          connectWallet={connectWallet}
          isLoading={isLoading}
        />
      )}
      
      {currentSection === 'demo' && (
        <DemoSection 
          connectWallet={connectWallet}
          isLoading={isLoading}
        />
      )}
      
      {currentSection === 'developer' && (
        <DeveloperSection />
      )}
    </div>
  );
}

// Navigation Component
function Navigation({ currentSection, setCurrentSection, walletConnected, connectedWallet, disconnectWallet }) {
  return (
    <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm border-b border-purple-500/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div 
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer"
              onClick={() => setCurrentSection('landing')}
            >
              sync.fm
            </div>
            <div className="hidden md:flex space-x-6">
              <button 
                onClick={() => setCurrentSection('swap')}
                className={`px-3 py-2 rounded-lg transition-all ${currentSection === 'swap' ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300 hover:text-purple-400'}`}
              >
                Swap
              </button>
              <button 
                onClick={() => setCurrentSection('demo')}
                className={`px-3 py-2 rounded-lg transition-all ${currentSection === 'demo' ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300 hover:text-purple-400'}`}
              >
                Demo
              </button>
              <button 
                onClick={() => setCurrentSection('developer')}
                className={`px-3 py-2 rounded-lg transition-all ${currentSection === 'developer' ? 'text-purple-400 bg-purple-500/10' : 'text-gray-300 hover:text-purple-400'}`}
              >
                Developers
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {walletConnected ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-300">
                  <span className="text-purple-400">{connectedWallet}</span>
                  <div className="text-xs text-gray-500">{userAddress.slice(0, 6)}...{userAddress.slice(-4)}</div>
                </div>
                <button 
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setCurrentSection('swap')}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Landing Page Component
function LandingPage({ setCurrentSection, platformStats, supportedChains, connectWallet, isLoading }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"></div>
        <div className="particles-bg absolute inset-0"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            sync.fm
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8 font-light">
            Web3, but easier
          </p>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Use any token on any dApp. I'll handle the cross-chain stuff for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => setCurrentSection('swap')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl text-lg font-semibold transition-all transform hover:scale-105 glow-effect"
            >
              Try Sync Now
            </button>
            <button 
              onClick={() => setCurrentSection('demo')}
              className="px-8 py-4 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-xl text-lg font-semibold transition-all"
            >
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-black/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            How I help you
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              title="Wrong token? No problem."
              description="Got ARB but need SOL? I'll sync that for you"
              icon="🔄"
            />
            <FeatureCard 
              title="Works everywhere"
              description="Any wallet, any chain, any dApp - seamlessly connected"
              icon="🌐"
            />
            <FeatureCard 
              title="Lightning fast"
              description="Most transactions complete in under 30 seconds"
              icon="⚡"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard label="Transaction Volume" value={platformStats.transaction_volume || "$50M+"} />
            <StatCard label="Success Rate" value={platformStats.success_rate || "99.9%"} />
            <StatCard label="Integrated dApps" value={platformStats.integrated_dapps || "50+"} />
            <StatCard label="Happy Users" value={platformStats.happy_users || "100K+"} />
          </div>
        </div>
      </section>

      {/* Supported Chains */}
      <section className="py-20 px-4 bg-black/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-white">
            Supported Networks
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {supportedChains.map((chain) => (
              <div key={chain.id} className="flex flex-col items-center p-4 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white font-bold">{chain.currency_symbol[0]}</span>
                </div>
                <span className="text-sm text-gray-300">{chain.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, description, icon }) {
  return (
    <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value }) {
  return (
    <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/20">
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <div className="text-gray-400">{label}</div>
    </div>
  );
}

// Swap Interface Component
function SwapInterface({ walletConnected, userAddress, supportedChains, connectWallet, isLoading }) {
  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('solana');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('SOL');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);

  const getQuote = async () => {
    if (!amount || !walletConnected) return;
    
    setSwapLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_chain: fromChain,
          to_chain: toChain,
          from_token: fromToken,
          to_token: toToken,
          amount: amount,
          slippage: 0.5,
          user_address: userAddress
        })
      });
      const data = await response.json();
      setQuote(data.quote);
    } catch (error) {
      console.error('Quote error:', error);
    }
    setSwapLoading(false);
  };

  const executeSwap = async () => {
    if (!quote) return;
    
    setSwapLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_chain: fromChain,
          to_chain: toChain,
          from_token: fromToken,
          to_token: toToken,
          amount: amount,
          slippage: 0.5,
          user_address: userAddress
        })
      });
      const data = await response.json();
      alert(`Swap initiated! Transaction ID: ${data.transaction_id}`);
      setQuote(null);
      setAmount('');
    } catch (error) {
      console.error('Swap error:', error);
    }
    setSwapLoading(false);
  };

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      getQuote();
    } else {
      setQuote(null);
    }
  }, [amount, fromChain, toChain, fromToken, toToken]);

  if (!walletConnected) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h2 className="text-3xl font-bold text-white mb-6">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8">Choose your preferred wallet to start swapping</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => connectWallet('metamask')}
              disabled={isLoading}
              className="w-full p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Connect MetaMask'}
            </button>
            <button 
              onClick={() => connectWallet('phantom')}
              disabled={isLoading}
              className="w-full p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Connect Phantom'}
            </button>
            <button 
              onClick={() => connectWallet('demo')}
              disabled={isLoading}
              className="w-full p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Demo Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Cross-Chain Swap</h2>
          
          {/* From Section */}
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">From</label>
            <div className="flex space-x-2">
              <select 
                value={fromChain} 
                onChange={(e) => setFromChain(e.target.value)}
                className="flex-1 p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                {supportedChains.map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
              <select 
                value={fromToken} 
                onChange={(e) => setFromToken(e.target.value)}
                className="flex-1 p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
            <input 
              type="number" 
              placeholder="0.0" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-2 p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
            />
          </div>

          {/* Swap Icon */}
          <div className="flex justify-center mb-4">
            <button className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-all">
              ↕️
            </button>
          </div>

          {/* To Section */}
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">To</label>
            <div className="flex space-x-2">
              <select 
                value={toChain} 
                onChange={(e) => setToChain(e.target.value)}
                className="flex-1 p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                {supportedChains.map(chain => (
                  <option key={chain.id} value={chain.id}>{chain.name}</option>
                ))}
              </select>
              <select 
                value={toToken} 
                onChange={(e) => setToToken(e.target.value)}
                className="flex-1 p-3 bg-gray-700 text-white rounded-lg border border-gray-600"
              >
                <option value="ETH">ETH</option>
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
              </select>
            </div>
            {quote && (
              <div className="mt-2 p-3 bg-gray-700/50 rounded-lg">
                <div className="text-white font-semibold">{parseFloat(quote.to_amount).toFixed(6)} {toToken}</div>
                <div className="text-sm text-gray-400">≈ ${(parseFloat(quote.to_amount) * (quote.to_token.price_usd || 0)).toFixed(2)}</div>
              </div>
            )}
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="mb-6 p-4 bg-gray-700/30 rounded-lg text-sm text-gray-300">
              <div className="flex justify-between mb-2">
                <span>Execution Time:</span>
                <span>{quote.execution_time}s</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Price Impact:</span>
                <span>{quote.price_impact}%</span>
              </div>
              {quote.bridge_fees && (
                <div className="flex justify-between">
                  <span>Bridge Fee:</span>
                  <span>{quote.bridge_fees} ETH</span>
                </div>
              )}
            </div>
          )}

          {/* Swap Button */}
          <button 
            onClick={executeSwap}
            disabled={!quote || swapLoading}
            className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {swapLoading ? 'Processing...' : quote ? 'Execute Swap' : 'Enter Amount'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Demo Section Component
function DemoSection({ connectWallet, isLoading }) {
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-6">Interactive Demo</h1>
          <p className="text-xl text-gray-400">Experience seamless cross-chain interactions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-2xl font-semibold text-white mb-4">Cross-Chain Swap Demo</h3>
            <p className="text-gray-400 mb-6">See how easy it is to swap tokens across different blockchains</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400">From: Ethereum</div>
                <div className="text-lg text-white">1.0 ETH</div>
              </div>
              <div className="text-center text-purple-400">↓</div>
              <div className="p-4 bg-gray-700/50 rounded-lg">
                <div className="text-sm text-gray-400">To: Solana</div>
                <div className="text-lg text-white">19.85 SOL</div>
              </div>
            </div>
            
            <button 
              onClick={() => connectWallet('demo')}
              disabled={isLoading}
              className="w-full mt-6 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Connecting...' : 'Try Demo Swap'}
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-2xl font-semibold text-white mb-4">Integration Example</h3>
            <p className="text-gray-400 mb-6">Add SYNC to your dApp with just a few lines of code</p>
            
            <div className="bg-black/50 rounded-lg p-4 text-sm text-green-400 font-mono">
              <div>npm install @sync/widget</div>
              <div className="mt-2">import SyncWidget from '@sync/widget'</div>
              <div className="mt-2">&lt;SyncWidget /&gt;</div>
            </div>
            
            <button className="w-full mt-6 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Developer Section Component
function DeveloperSection() {
  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-6">Developer Integration</h1>
          <p className="text-xl text-gray-400">Add SYNC to your dApp in minutes</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-2xl font-semibold text-white mb-4">Widget Integration</h3>
            <p className="text-gray-400 mb-6">Embed SYNC directly into your application</p>
            
            <div className="bg-black/50 rounded-lg p-4 text-sm text-green-400 font-mono mb-4">
              <div>&lt;script src="https://cdn.sync.fm/widget.js"&gt;&lt;/script&gt;</div>
              <div className="mt-2">&lt;div id="sync-widget"&gt;&lt;/div&gt;</div>
              <div className="mt-2">new SyncWidget({{ containerId: 'sync-widget' }});</div>
            </div>
            
            <button className="w-full p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all">
              Get Widget Code
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 border border-purple-500/20">
            <h3 className="text-2xl font-semibold text-white mb-4">API Integration</h3>
            <p className="text-gray-400 mb-6">Use our REST API for custom implementations</p>
            
            <div className="bg-black/50 rounded-lg p-4 text-sm text-green-400 font-mono mb-4">
              <div>POST /api/quote</div>
              <div className="mt-2">POST /api/swap</div>
              <div className="mt-2">GET /api/chains</div>
              <div className="mt-2">GET /api/portfolio/:address</div>
            </div>
            
            <button className="w-full p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all">
              API Documentation
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-purple-500/20">
          <h3 className="text-3xl font-semibold text-white mb-4 text-center">Ready to integrate?</h3>
          <p className="text-gray-400 text-center mb-8">Join thousands of developers building the future of Web3</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all">
              Get Started
            </button>
            <button className="px-8 py-3 border-2 border-purple-500 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;