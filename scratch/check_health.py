import requests

ports = [8001, 8002, 8003, 8004]
for port in ports:
    try:
        res = requests.get(f"http://127.0.0.1:{port}/health", timeout=3)
        print(f"Port {port}: status={res.status_code}, content={res.json()}")
    except Exception as e:
        print(f"Port {port}: FAILED - {e}")
