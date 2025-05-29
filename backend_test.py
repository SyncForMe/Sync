
import requests
import sys
import json
from datetime import datetime

class SyncAPITester:
    def __init__(self, base_url="https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

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
            "user_address": "test123"
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
            "/api/portfolio/test123",
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
        tester.test_get_stats,
        tester.test_portfolio
    ]
    
    for test in tests:
        test()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
