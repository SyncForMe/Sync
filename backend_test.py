
import requests
import sys
import json
from datetime import datetime

class SyncAPITester:
    def __init__(self, base_url="https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_address = "demo_address_123"

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                    return False, response.json()
                except:
                    return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "/api/",
            200
        )
        if success:
            print(f"API Info: {response}")
            if 'supported_chains' in response:
                print(f"Supported chains count: {response['supported_chains']}")
        return success

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "/api/health",
            200
        )
        return success

    def test_get_chains(self):
        """Test get chains endpoint"""
        success, response = self.run_test(
            "Get Supported Chains",
            "GET",
            "/api/chains",
            200
        )
        if success and 'chains' in response:
            chains = response['chains']
            print(f"Found {len(chains)} supported chains:")
            for chain in chains:
                print(f"  - {chain['name']} ({chain['id']})")
        return success

    def test_get_tokens(self):
        """Test get tokens endpoint"""
        success, response = self.run_test(
            "Get Tokens for Ethereum",
            "GET",
            "/api/tokens/ethereum",
            200
        )
        if success and 'tokens' in response:
            tokens = response['tokens']
            print(f"Found {len(tokens)} tokens for Ethereum:")
            for token in tokens:
                print(f"  - {token['name']} ({token['symbol']})")
        return success

    def test_get_quote(self):
        """Test get quote endpoint"""
        data = {
            "from_chain": "ethereum",
            "to_chain": "solana",
            "from_token": "ETH",
            "to_token": "SOL",
            "amount": "1.0",
            "slippage": 0.5,
            "user_address": self.test_user_address
        }
        
        success, response = self.run_test(
            "Get Cross-Chain Quote",
            "POST",
            "/api/quote",
            200,
            data=data
        )
        
        if success and 'quote' in response:
            quote = response['quote']
            print(f"Quote received:")
            print(f"  From: {quote['from_amount']} {quote['from_token']['symbol']} on {data['from_chain']}")
            print(f"  To: {quote['to_amount']} {quote['to_token']['symbol']} on {data['to_chain']}")
            print(f"  Execution time: {quote['execution_time']}s")
            if 'bridge_fees' in quote and quote['bridge_fees']:
                print(f"  Bridge fees: {quote['bridge_fees']}")
        
        return success

    def test_execute_swap(self):
        """Test swap execution endpoint"""
        data = {
            "from_chain": "ethereum",
            "to_chain": "solana",
            "from_token": "ETH",
            "to_token": "SOL",
            "amount": "1.0",
            "slippage": 0.5,
            "user_address": self.test_user_address
        }
        
        success, response = self.run_test(
            "Execute Cross-Chain Swap",
            "POST",
            "/api/swap",
            200,
            data=data
        )
        
        if success:
            print(f"Swap executed successfully:")
            print(f"  Transaction ID: {response.get('transaction_id')}")
            print(f"  Status: {response.get('status')}")
            print(f"  TX Hash: {response.get('tx_hash')}")
            print(f"  From: {response.get('from_amount')} ETH")
            print(f"  To: {response.get('to_amount')} SOL")
        
        return success

    def test_get_transactions(self):
        """Test get user transactions endpoint"""
        success, response = self.run_test(
            "Get User Transactions",
            "GET",
            f"/api/transactions/{self.test_user_address}",
            200
        )
        
        if success and 'transactions' in response:
            transactions = response['transactions']
            print(f"Found {len(transactions)} transactions for user {self.test_user_address}:")
            for tx in transactions[:3]:  # Show first 3 transactions
                print(f"  - {tx['from_amount']} {tx['from_token']} → {tx['to_amount']} {tx['to_token']} ({tx['status']})")
        
        return success

    def test_get_stats(self):
        """Test get platform stats endpoint"""
        success, response = self.run_test(
            "Get Platform Stats",
            "GET",
            "/api/stats",
            200
        )
        
        if success:
            print("Platform Statistics:")
            for key, value in response.items():
                print(f"  {key}: {value}")
        
        return success

    def test_portfolio(self):
        """Test get user portfolio endpoint"""
        success, response = self.run_test(
            "Get User Portfolio",
            "GET",
            f"/api/portfolio/{self.test_user_address}",
            200
        )
        
        if success and 'portfolio' in response:
            portfolio = response['portfolio']
            print(f"Portfolio for user {portfolio['user_address']}:")
            print(f"  Total value: ${portfolio['total_usd']}")
            for chain, data in portfolio['chains'].items():
                print(f"  {chain.capitalize()}: ${data['total_usd']}")
                for token in data['tokens']:
                    print(f"    {token['balance']} {token['symbol']} (${token['usd_value']})")
        
        return success

    def test_sdk_widget_config(self):
        """Test SDK widget configuration endpoint"""
        success, response = self.run_test(
            "Get SDK Widget Config",
            "GET",
            "/api/sdk/widget-config",
            200
        )
        
        if success:
            print("SDK Widget Configuration:")
            for key, value in response.items():
                print(f"  {key}: {value}")
        
        return success

def main():
    # Setup
    tester = SyncAPITester()
    
    # Run tests
    tests = [
        tester.test_api_root,
        tester.test_health_check,
        tester.test_get_chains,
        tester.test_get_tokens,
        tester.test_get_quote,
        tester.test_execute_swap,  # Added swap execution test
        tester.test_get_transactions,  # Added transactions test
        tester.test_get_stats,
        tester.test_portfolio,
        tester.test_sdk_widget_config  # Added SDK widget config test
    ]
    
    for test in tests:
        test()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
