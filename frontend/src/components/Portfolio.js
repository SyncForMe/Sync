import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com';

function Portfolio({ userAddress, isVisible }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (userAddress && isVisible) {
      fetchPortfolio();
      fetchTransactions();
    }
  }, [userAddress, isVisible]);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/portfolio/${userAddress}`);
      const data = await response.json();
      setPortfolio(data.portfolio);
    } catch (error) {
      console.error('Portfolio fetch error:', error);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/transactions/${userAddress}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Transactions fetch error:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Portfolio Dashboard</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="cyber-loading"></div>
            <span className="ml-3 text-gray-400">Loading portfolio...</span>
          </div>
        ) : portfolio ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Portfolio Overview */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
              <h2 className="text-2xl font-semibold text-white mb-6">Total Portfolio Value</h2>
              <div className="text-4xl font-bold text-purple-400 mb-6">
                ${portfolio.total_usd?.toLocaleString() || '0'}
              </div>
              
              <div className="space-y-4">
                {Object.entries(portfolio.chains || {}).map(([chainId, chainData]) => (
                  <div key={chainId} className="p-4 bg-gray-700/30 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-white capitalize">{chainId}</h3>
                      <span className="text-purple-400 font-semibold">
                        ${chainData.total_usd?.toLocaleString() || '0'}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {chainData.tokens?.map((token, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {token.balance} {token.symbol}
                          </span>
                          <span className="text-gray-400">
                            ${token.usd_value?.toLocaleString() || '0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
              <h2 className="text-2xl font-semibold text-white mb-6">Recent Transactions</h2>
              
              {transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-4 bg-gray-700/30 rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${
                            tx.status === 'completed' ? 'bg-green-500' :
                            tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-white font-medium">
                            {tx.from_chain} → {tx.to_chain}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-300">
                        {tx.from_amount} {tx.from_token} → {tx.to_amount} {tx.to_token}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1 capitalize">
                        Status: {tx.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No transactions yet. Start swapping to see your history!
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-16">
            Connect your wallet to view portfolio
          </div>
        )}
      </div>
    </div>
  );
}

export default Portfolio;