
import requests
import sys
import json
from datetime import datetime

class SyncAPITester:
    def __init__(self, base_url="https://af267735-92eb-4cf3-b052-dff209029be0.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_address = "0x1234567890abcdef1234567890abcdef12345678"  # Demo user address

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
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

    def test_health_check(self):
        """Test API health endpoint"""
        return self.run_test(
            "API Health Check",
            "GET",
            "health",
            200
        )

    def test_get_chains(self):
        """Test getting supported chains"""
        return self.run_test(
            "Get Supported Chains",
            "GET",
            "chains",
            200
        )

    def test_get_tokens(self):
        """Test getting tokens for a chain"""
        return self.run_test(
            "Get Tokens for Ethereum",
            "GET",
            "tokens/ethereum",
            200
        )

    def test_get_swap_quote(self):
        """Test getting a swap quote"""
        data = {
            "from_chain": "ethereum",
            "to_chain": "solana",
            "from_token": "ETH",
            "to_token": "SOL",
            "amount": "1.0",
            "slippage": 0.5,
            "user_address": self.test_user_address
        }
        return self.run_test(
            "Get Swap Quote",
            "POST",
            "quote",
            200,
            data=data
        )

    def test_execute_swap(self):
        """Test executing a swap"""
        data = {
            "from_chain": "ethereum",
            "to_chain": "solana",
            "from_token": "ETH",
            "to_token": "SOL",
            "amount": "0.5",
            "slippage": 0.5,
            "user_address": self.test_user_address
        }
        return self.run_test(
            "Execute Swap",
            "POST",
            "swap",
            200,
            data=data
        )

    def test_get_transactions(self):
        """Test getting user transactions"""
        return self.run_test(
            "Get User Transactions",
            "GET",
            f"transactions/{self.test_user_address}",
            200
        )

    def test_get_portfolio(self):
        """Test getting user portfolio"""
        return self.run_test(
            "Get User Portfolio",
            "GET",
            f"portfolio/{self.test_user_address}",
            200
        )

    def test_get_platform_stats(self):
        """Test getting platform statistics"""
        return self.run_test(
            "Get Platform Stats",
            "GET",
            "stats",
            200
        )

    def test_get_token_prices(self):
        """Test getting token prices"""
        return self.run_test(
            "Get Token Prices",
            "GET",
            "prices",
            200
        )

    def test_get_market_data(self):
        """Test getting market data"""
        return self.run_test(
            "Get Market Data",
            "GET",
            "market-data",
            200
        )

    def test_get_embed_quote(self):
        """Test getting embed quote for SDK"""
        data = {
            "from_chain": "ethereum",
            "to_chain": "polygon",
            "from_token": "ETH",
            "to_token": "MATIC",
            "amount": "0.1",
            "slippage": 0.5,
            "user_address": self.test_user_address
        }
        return self.run_test(
            "Get Embed Quote for SDK",
            "POST",
            "sdk/embed-quote",
            200,
            data=data
        )

def main():
    # Setup
    tester = SyncAPITester()
    
    # Run tests
    tester.test_health_check()
    tester.test_get_chains()
    tester.test_get_tokens()
    tester.test_get_swap_quote()
    tester.test_execute_swap()
    tester.test_get_transactions()
    tester.test_get_portfolio()
    tester.test_get_platform_stats()
    tester.test_get_token_prices()
    tester.test_get_market_data()
    tester.test_get_embed_quote()

    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
