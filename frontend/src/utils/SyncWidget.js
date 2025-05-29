// SYNC Widget SDK - Embeddable Cross-Chain Swap Widget
class SyncWidget {
  constructor(options = {}) {
    this.containerId = options.containerId || 'sync-widget';
    this.theme = options.theme || 'dark';
    this.chains = options.chains || ['ethereum', 'polygon', 'arbitrum', 'solana'];
    this.apiUrl = options.apiUrl || 'https://api.sync.fm';
    this.onSwapComplete = options.onSwapComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    this.init();
  }

  init() {
    this.createStyles();
    this.createWidget();
    this.bindEvents();
  }

  createStyles() {
    const styles = `
      .sync-widget {
        font-family: 'Inter', sans-serif;
        background: ${this.theme === 'dark' ? '#1a1a1a' : '#ffffff'};
        border: 1px solid ${this.theme === 'dark' ? '#333' : '#e0e0e0'};
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        margin: 0 auto;
        color: ${this.theme === 'dark' ? '#ffffff' : '#000000'};
      }
      
      .sync-widget-header {
        text-align: center;
        margin-bottom: 20px;
        font-size: 18px;
        font-weight: 600;
        color: #8000ff;
      }
      
      .sync-widget-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .sync-widget-input-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .sync-widget-label {
        font-size: 14px;
        font-weight: 500;
        opacity: 0.8;
      }
      
      .sync-widget-input {
        padding: 12px;
        border: 1px solid ${this.theme === 'dark' ? '#444' : '#ccc'};
        border-radius: 8px;
        background: ${this.theme === 'dark' ? '#2a2a2a' : '#f5f5f5'};
        color: inherit;
        font-size: 16px;
      }
      
      .sync-widget-button {
        background: linear-gradient(45deg, #8000ff, #ff0080);
        color: white;
        border: none;
        padding: 14px 20px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .sync-widget-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(128, 0, 255, 0.3);
      }
      
      .sync-widget-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .sync-widget-quote {
        background: ${this.theme === 'dark' ? '#2a2a2a' : '#f0f0f0'};
        border-radius: 8px;
        padding: 12px;
        margin: 12px 0;
      }
      
      .sync-widget-loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #8000ff;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .sync-widget-error {
        background: #ff4444;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        margin: 8px 0;
      }
      
      .sync-widget-success {
        background: #44ff44;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        margin: 8px 0;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  createWidget() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with ID "${this.containerId}" not found`);
      return;
    }

    container.innerHTML = `
      <div class="sync-widget">
        <div class="sync-widget-header">
          🔄 SYNC Cross-Chain Swap
        </div>
        
        <form class="sync-widget-form" id="sync-widget-form">
          <div class="sync-widget-input-group">
            <label class="sync-widget-label">From Chain</label>
            <select class="sync-widget-input" id="from-chain">
              ${this.chains.map(chain => `<option value="${chain}">${this.formatChainName(chain)}</option>`).join('')}
            </select>
          </div>
          
          <div class="sync-widget-input-group">
            <label class="sync-widget-label">From Token</label>
            <select class="sync-widget-input" id="from-token">
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          
          <div class="sync-widget-input-group">
            <label class="sync-widget-label">Amount</label>
            <input type="number" class="sync-widget-input" id="amount" placeholder="0.0" step="0.000001">
          </div>
          
          <div class="sync-widget-input-group">
            <label class="sync-widget-label">To Chain</label>
            <select class="sync-widget-input" id="to-chain">
              ${this.chains.map(chain => `<option value="${chain}">${this.formatChainName(chain)}</option>`).join('')}
            </select>
          </div>
          
          <div class="sync-widget-input-group">
            <label class="sync-widget-label">To Token</label>
            <select class="sync-widget-input" id="to-token">
              <option value="SOL">SOL</option>
              <option value="USDC">USDC</option>
              <option value="MATIC">MATIC</option>
            </select>
          </div>
          
          <div id="quote-container"></div>
          <div id="message-container"></div>
          
          <button type="submit" class="sync-widget-button" id="swap-button">
            Get Quote
          </button>
        </form>
      </div>
    `;
  }

  bindEvents() {
    const form = document.getElementById('sync-widget-form');
    const amountInput = document.getElementById('amount');
    const swapButton = document.getElementById('swap-button');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSwap();
    });

    amountInput.addEventListener('input', () => {
      if (parseFloat(amountInput.value) > 0) {
        this.getQuote();
      } else {
        this.clearQuote();
      }
    });

    // Update tokens when chain changes
    document.getElementById('from-chain').addEventListener('change', () => {
      this.updateTokenOptions('from-token', document.getElementById('from-chain').value);
    });

    document.getElementById('to-chain').addEventListener('change', () => {
      this.updateTokenOptions('to-token', document.getElementById('to-chain').value);
    });
  }

  formatChainName(chain) {
    const names = {
      'ethereum': 'Ethereum',
      'polygon': 'Polygon',
      'arbitrum': 'Arbitrum',
      'optimism': 'Optimism',
      'bsc': 'BSC',
      'fantom': 'Fantom',
      'avalanche': 'Avalanche',
      'solana': 'Solana'
    };
    return names[chain] || chain;
  }

  updateTokenOptions(selectId, chain) {
    const select = document.getElementById(selectId);
    const tokens = {
      'ethereum': ['ETH', 'USDC', 'USDT'],
      'polygon': ['MATIC', 'USDC', 'USDT'],
      'arbitrum': ['ETH', 'ARB', 'USDC'],
      'optimism': ['ETH', 'OP', 'USDC'],
      'bsc': ['BNB', 'USDT', 'USDC'],
      'fantom': ['FTM', 'USDC'],
      'avalanche': ['AVAX', 'USDC'],
      'solana': ['SOL', 'USDC']
    };

    select.innerHTML = tokens[chain]?.map(token => 
      `<option value="${token}">${token}</option>`
    ).join('') || '';
  }

  async getQuote() {
    const formData = this.getFormData();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;

    this.showLoading();

    try {
      const response = await fetch(`${this.apiUrl}/api/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_chain: formData.fromChain,
          to_chain: formData.toChain,
          from_token: formData.fromToken,
          to_token: formData.toToken,
          amount: formData.amount,
          slippage: 0.5,
          user_address: 'widget_user'
        })
      });

      const data = await response.json();
      
      if (data.quote) {
        this.displayQuote(data.quote);
        document.getElementById('swap-button').textContent = 'Execute Swap';
        document.getElementById('swap-button').disabled = false;
      } else {
        throw new Error('No quote received');
      }
    } catch (error) {
      this.showError('Failed to get quote: ' + error.message);
    }
  }

  async handleSwap() {
    const formData = this.getFormData();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      this.showError('Please enter a valid amount');
      return;
    }

    this.showLoading();
    document.getElementById('swap-button').disabled = true;

    try {
      const response = await fetch(`${this.apiUrl}/api/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_chain: formData.fromChain,
          to_chain: formData.toChain,
          from_token: formData.fromToken,
          to_token: formData.toToken,
          amount: formData.amount,
          slippage: 0.5,
          user_address: 'widget_user'
        })
      });

      const data = await response.json();
      
      if (data.transaction_id) {
        this.showSuccess(`Swap successful! Transaction: ${data.transaction_id.slice(0, 8)}...`);
        this.onSwapComplete(data);
        this.resetForm();
      } else {
        throw new Error('Swap failed');
      }
    } catch (error) {
      this.showError('Swap failed: ' + error.message);
      this.onError(error);
    } finally {
      document.getElementById('swap-button').disabled = false;
      document.getElementById('swap-button').textContent = 'Get Quote';
    }
  }

  getFormData() {
    return {
      fromChain: document.getElementById('from-chain').value,
      fromToken: document.getElementById('from-token').value,
      toChain: document.getElementById('to-chain').value,
      toToken: document.getElementById('to-token').value,
      amount: document.getElementById('amount').value
    };
  }

  displayQuote(quote) {
    const container = document.getElementById('quote-container');
    container.innerHTML = `
      <div class="sync-widget-quote">
        <div><strong>You'll receive:</strong> ${parseFloat(quote.to_amount).toFixed(6)} ${quote.to_token.symbol}</div>
        <div><strong>Execution time:</strong> ~${quote.execution_time}s</div>
        <div><strong>Price impact:</strong> ${quote.price_impact}%</div>
        ${quote.bridge_fees ? `<div><strong>Bridge fee:</strong> ${quote.bridge_fees} ETH</div>` : ''}
      </div>
    `;
  }

  clearQuote() {
    document.getElementById('quote-container').innerHTML = '';
    document.getElementById('swap-button').textContent = 'Get Quote';
  }

  showLoading() {
    const container = document.getElementById('message-container');
    container.innerHTML = '<div class="sync-widget-loading"></div>';
  }

  showError(message) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="sync-widget-error">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  }

  showSuccess(message) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<div class="sync-widget-success">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  }

  resetForm() {
    document.getElementById('amount').value = '';
    this.clearQuote();
  }
}

// Make it globally available
window.SyncWidget = SyncWidget;

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', () => {
  const widgets = document.querySelectorAll('[data-sync-widget]');
  widgets.forEach(element => {
    const options = {
      containerId: element.id,
      theme: element.dataset.theme || 'dark',
      chains: element.dataset.chains ? element.dataset.chains.split(',') : undefined
    };
    new SyncWidget(options);
  });
});

export default SyncWidget;