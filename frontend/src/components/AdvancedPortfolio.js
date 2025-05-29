import React, { useState, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com';

function AdvancedPortfolio({ userAddress, isVisible }) {
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [chartData, setChartData] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    if (userAddress && isVisible) {
      fetchPortfolioData();
      fetchTransactions();
      generateChartData();
    }
  }, [userAddress, isVisible, selectedTimeframe]);

  const fetchPortfolioData = async () => {
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

  const generateChartData = () => {
    // Generate sample portfolio performance data
    const now = Date.now();
    const timeframes = {
      '24h': { points: 24, interval: 60 * 60 * 1000 },
      '7d': { points: 7, interval: 24 * 60 * 60 * 1000 },
      '30d': { points: 30, interval: 24 * 60 * 60 * 1000 },
      '1y': { points: 365, interval: 24 * 60 * 60 * 1000 }
    };

    const { points, interval } = timeframes[selectedTimeframe];
    const baseValue = portfolio?.total_usd || 7000;
    
    const data = [];
    for (let i = points; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const volatility = Math.random() * 0.1 - 0.05; // ±5% volatility
      const value = baseValue * (1 + volatility);
      
      data.push({
        timestamp,
        value: Math.max(value, 0),
        date: new Date(timestamp).toLocaleDateString()
      });
    }
    
    setChartData(data);
  };

  const drawChart = () => {
    if (!chartRef.current || chartData.length === 0) return;

    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;
    const padding = 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate min/max values
    const values = chartData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue || 1;

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(128, 0, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 0, 128, 0.1)');

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#8000ff';
    ctx.lineWidth = 2;

    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Fill area under line
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw data points
    ctx.fillStyle = '#ff0080';
    chartData.forEach((point, index) => {
      const x = padding + (index / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((point.value - minValue) / valueRange) * (height - 2 * padding);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  useEffect(() => {
    if (chartData.length > 0) {
      drawChart();
    }
  }, [chartData]);

  const calculatePerformance = () => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;
    const change = lastValue - firstValue;
    const percentage = (change / firstValue) * 100;
    
    return { change, percentage };
  };

  const { change, percentage } = calculatePerformance();

  if (!isVisible) return null;

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Advanced Portfolio
          </h1>
          <div className="flex space-x-2">
            {['24h', '7d', '30d', '1y'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedTimeframe === timeframe
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="cyber-loading"></div>
            <span className="ml-3 text-gray-400">Loading portfolio...</span>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Portfolio Overview */}
            <div className="lg:col-span-2 space-y-8">
              {/* Portfolio Value Chart */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Portfolio Value</h3>
                    <div className="text-4xl font-bold text-purple-400 mb-2">
                      ${portfolio?.total_usd?.toLocaleString() || '0'}
                    </div>
                    <div className={`flex items-center space-x-2 text-sm ${
                      change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span>{change >= 0 ? '↗' : '↘'}</span>
                      <span>{change >= 0 ? '+' : ''}${change.toFixed(2)}</span>
                      <span>({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)</span>
                      <span className="text-gray-500">({selectedTimeframe})</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-64 relative">
                  <canvas
                    ref={chartRef}
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
              </div>

              {/* Assets Breakdown */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-2xl font-semibold text-white mb-6">Assets by Chain</h3>
                
                <div className="space-y-4">
                  {portfolio && Object.entries(portfolio.chains || {}).map(([chainId, chainData]) => (
                    <div key={chainId} className="p-4 bg-gray-700/30 rounded-xl">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {chainId.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-white capitalize">{chainId}</h4>
                        </div>
                        <span className="text-purple-400 font-semibold">
                          ${chainData.total_usd?.toLocaleString() || '0'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {chainData.tokens?.map((token, index) => (
                          <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 font-medium">{token.symbol}</span>
                              <span className="text-sm text-gray-400">
                                ${token.usd_value?.toLocaleString() || '0'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {parseFloat(token.balance).toFixed(4)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Transactions</span>
                    <span className="text-white font-semibold">{transactions.length}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Chains</span>
                    <span className="text-white font-semibold">
                      {portfolio ? Object.keys(portfolio.chains || {}).length : 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Avg Transaction</span>
                    <span className="text-white font-semibold">
                      ${portfolio ? (portfolio.total_usd / Math.max(transactions.length, 1)).toFixed(0) : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
                
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${
                            tx.status === 'completed' ? 'bg-green-500' :
                            tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-sm text-white font-medium">
                            {tx.from_chain} → {tx.to_chain}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-300">
                          {parseFloat(tx.from_amount).toFixed(4)} {tx.from_token}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(tx.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-4">
                    No recent activity
                  </div>
                )}
              </div>

              {/* Performance Indicators */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <h3 className="text-xl font-semibold text-white mb-4">Performance</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">24h Change</span>
                    <span className={`font-semibold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {change >= 0 ? '+' : ''}{percentage.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Best Performer</span>
                    <span className="text-green-400 font-semibold">ETH +5.2%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Risk Score</span>
                    <span className="text-yellow-400 font-semibold">Medium</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedPortfolio;