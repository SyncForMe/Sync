import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com';

function RealTimeUpdates({ userAddress, onUpdate }) {
  const [wsConnection, setWsConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [recentUpdates, setRecentUpdates] = useState([]);

  useEffect(() => {
    if (userAddress) {
      connectWebSocket();
    }
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [userAddress]);

  const connectWebSocket = () => {
    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/api/ws';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        setWsConnection(ws);
        console.log('WebSocket connected');
        
        // Send initial message
        ws.send(JSON.stringify({
          type: 'subscribe',
          user_address: userAddress
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeUpdate(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };
      
      ws.onclose = () => {
        setConnectionStatus('disconnected');
        setWsConnection(null);
        console.log('WebSocket disconnected');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (userAddress) {
            connectWebSocket();
          }
        }, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
    }
  };

  const handleRealtimeUpdate = (data) => {
    console.log('Realtime update received:', data);
    
    // Add to recent updates
    const update = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...data
    };
    
    setRecentUpdates(prev => [update, ...prev.slice(0, 9)]); // Keep last 10 updates
    
    // Notify parent component
    if (onUpdate) {
      onUpdate(data);
    }
    
    // Show notification based on update type
    if (data.type === 'transaction_started') {
      showNotification('Transaction Started', 'Your cross-chain swap has been initiated', 'info');
    } else if (data.type === 'transaction_completed') {
      showNotification('Transaction Completed', 'Your cross-chain swap was successful!', 'success');
    } else if (data.type === 'price_update') {
      showNotification('Price Update', `${data.token} price updated`, 'info');
    }
  };

  const showNotification = (title, message, type) => {
    // Create a simple notification system
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg max-w-sm transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' : 'bg-purple-600'
    } text-white shadow-lg`;
    
    notification.innerHTML = `
      <div class="font-semibold">${title}</div>
      <div class="text-sm opacity-90">${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Connection Status Indicator */}
      <div className={`mb-2 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 ${
        connectionStatus === 'connected' ? 'bg-green-600' :
        connectionStatus === 'error' ? 'bg-red-600' : 'bg-gray-600'
      } text-white`}>
        <div className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-green-300 animate-pulse' :
          connectionStatus === 'error' ? 'bg-red-300' : 'bg-gray-300'
        }`}></div>
        <span>
          {connectionStatus === 'connected' ? 'Live' :
           connectionStatus === 'error' ? 'Error' : 'Connecting...'}
        </span>
      </div>

      {/* Recent Updates Panel (if connected) */}
      {connectionStatus === 'connected' && recentUpdates.length > 0 && (
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 max-w-xs border border-purple-500/20">
          <h4 className="text-white font-semibold mb-2 text-sm">Recent Updates</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentUpdates.slice(0, 3).map((update) => (
              <div key={update.id} className="text-xs text-gray-300 p-2 bg-gray-700/50 rounded">
                <div className="font-medium capitalize">{update.type?.replace('_', ' ')}</div>
                <div className="text-gray-400">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeUpdates;