import requests

def test_facebook_login_invalid_token():
    url = "http://127.0.0.1:8001/facebook-login"
    payload = {
        "access_token": "invalid_mock_token_for_testing_purposes"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        # We expect a 400 Bad Request error because the token is invalid
        if response.status_code == 400:
            print("SUCCESS: Endpoint correctly rejected invalid token.")
        else:
            print("FAIL: Expected 400 Bad Request, got different status.")
    except Exception as e:
        print(f"FAIL: Request failed: {e}")

if __name__ == "__main__":
    test_facebook_login_invalid_token()
