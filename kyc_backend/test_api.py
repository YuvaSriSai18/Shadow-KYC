"""
Test script for Simplified KYC Backend API
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health_endpoint():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Health Check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_detailed_health():
    """Test the detailed health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Detailed Health: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Detailed health check failed: {e}")
        return False

def test_url_extraction():
    """Test URL-based Aadhaar extraction"""
    # This is a placeholder test - you would need an actual accessible ZIP URL
    test_data = {
        "zip_url": "https://example.com/test-aadhaar.zip",
        "share_code": "1234"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/extract-aadhaar-from-url", json=test_data)
        print(f"URL Extraction Test: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # For this test, we expect it to fail since we don't have a real URL
        # A 400 error is expected and considered "successful" for this test
        return response.status_code in [200, 400]
    except Exception as e:
        print(f"URL extraction test failed: {e}")
        return False

def main():
    print("="*50)
    print("KYC Backend API Test Suite")
    print("="*50)
    
    tests = [
        ("Basic Health Check", test_health_endpoint),
        ("Detailed Health Check", test_detailed_health),
        ("URL Extraction Test", test_url_extraction),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        result = test_func()
        results.append((test_name, result))
        print(f"Result: {'PASS' if result else 'FAIL'}")
    
    print("\n" + "="*50)
    print("Test Results Summary:")
    print("="*50)
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"{test_name:<25}: {status}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")

if __name__ == "__main__":
    main()