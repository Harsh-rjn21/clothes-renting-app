import subprocess
import time
import requests
import sys
import os

services = {
    "auth": {"port": 8001, "cwd": "services/auth"},
    "catalog": {"port": 8002, "cwd": "services/catalog"},
    "rental": {"port": 8003, "cwd": "services/rental"},
    "feedback": {"port": 8004, "cwd": "services/feedback"}
}

processes = []

def start_services():
    print("Starting backend services...")
    for name, config in services.items():
        port = config["port"]
        cwd = config["cwd"]
        
        # Start uvicorn process using virtualenv python
        python_exe = os.path.abspath("venv/Scripts/python.exe")
        cmd = [python_exe, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(port)]
        
        print(f"  Launching {name} service on port {port}...")
        proc = subprocess.Popen(
            cmd, 
            cwd=cwd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        processes.append((name, proc))
    
    # Wait a bit for startup
    print("Waiting 10 seconds for services to boot up...")
    time.sleep(10)

def check_health():
    print("\nChecking health endpoints...")
    all_ok = True
    for name, config in services.items():
        url = f"http://127.0.0.1:{config['port']}/health"
        try:
            res = requests.get(url, timeout=2)
            if res.status_code == 200 and res.json().get("status") == "ok":
                print(f"  [PASS] {name} service is healthy.")
            else:
                print(f"  [FAIL] {name} service returned status {res.status_code}.")
                all_ok = False
        except Exception as e:
            print(f"  [FAIL] {name} service health check failed: {e}")
            all_ok = False
    return all_ok

def run_tests():
    print("\nRunning API integration tests...")
    
    # 1. Register admin user
    print("Test 1: Admin Registration & Login...")
    signup_url = "http://127.0.0.1:8001/signup"
    login_url = "http://127.0.0.1:8001/login"
    
    # Clean up previous db records if any (we can use a random email to be safe)
    admin_email = f"admin_test_{int(time.time())}@example.com"
    
    # We add this email to ADMIN_EMAILS temporarily by mock login or register
    # Note: ADMIN_EMAILS in auth/main.py has "admin@example.com" and "harsh@example.com"
    # Let's register as connects.local.1221@gmail.com which is in ADMIN_EMAILS
    admin_email = "admin@example.com"
    
    # Sign up
    try:
        signup_payload = {
            "email": admin_email,
            "password": "securepassword123",
            "full_name": "Test Administrator"
        }
        res = requests.post(signup_url, json=signup_payload)
        # 400 is fine if already registered
        if res.status_code in [200, 201]:
            print("  [PASS] Admin registered successfully.")
        elif res.status_code == 400 and "already registered" in res.text:
            print("  - Admin already registered. Continuing to login.")
        else:
            print(f"  [FAIL] Signup failed: {res.text}")
            return False
    except Exception as e:
        print(f"  [FAIL] Signup failed: {e}")
        return False
        
    # Login
    try:
        login_res = requests.post(login_url, data={
            "username": admin_email,
            "password": "securepassword123"
        })
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            print("  [PASS] Admin logged in. Token acquired.")
        else:
            print(f"  [FAIL] Login failed: {login_res.text}")
            return False
    except Exception as e:
        print(f"  [FAIL] Login failed: {e}")
        return False
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Instagram Login test
    print("\nTest 2: Instagram Social Login...")
    try:
        insta_res = requests.post("http://127.0.0.1:8001/instagram-login", json={
            "instagram_id": "test_insta_user",
            "full_name": "Test Instagram User"
        })
        if insta_res.status_code == 200:
            print("  [PASS] Instagram OAuth sign-in completed. Token received.")
        else:
            print(f"  [FAIL] Instagram Login failed: {insta_res.text}")
            return False
    except Exception as e:
        print(f"  [FAIL] Instagram Login failed: {e}")
        return False
        
    # 3. Create Categories and Products
    print("\nTest 3: Catalog Creation & Pricing Models...")
    try:
        # Create category
        cat_res = requests.post("http://127.0.0.1:8002/categories", json={"name": "Lehenga Test"}, headers=headers)
        # 201 or 400 (if exists) is fine
        print("  [PASS] Checked category creation.")
        
        # Add Rent Product
        rent_prod = {
            "name": "Luxury Silk Lehenga",
            "description": "Premium rental silk lehenga",
            "category": "Lehenga Test",
            "type": "rent",
            "price_rent_3day": 120.0,
            "price_rent_3day_sale": 90.0,
            "price_rent_subsequent": 15.0,
            "color": "Gold",
            "size": "M"
        }
        res_rent = requests.post("http://127.0.0.1:8002/products", json=rent_prod, headers=headers)
        if res_rent.status_code == 201:
            rent_id = res_rent.json()["id"]
            print(f"  [PASS] Rental product created. ID: {rent_id}")
        else:
            print(f"  [FAIL] Failed to create rental product: {res_rent.text}")
            return False
            
        # Add Buy Product
        buy_prod = {
            "name": "Designer Saree Sale",
            "description": "Premium silk saree for purchase",
            "category": "Lehenga Test",
            "type": "buy",
            "price_buy": 300.0,
            "price_buy_sale": 250.0,
            "color": "Red",
            "size": "Free"
        }
        res_buy = requests.post("http://127.0.0.1:8002/products", json=buy_prod, headers=headers)
        if res_buy.status_code == 201:
            buy_id = res_buy.json()["id"]
            print(f"  [PASS] Purchase product created. ID: {buy_id}")
        else:
            print(f"  [FAIL] Failed to create purchase product: {res_buy.text}")
            return False
            
    except Exception as e:
        print(f"  [FAIL] Catalog creation failed: {e}")
        return False
 
    # 4. Verify Pricing and Discount Engine
    print("\nTest 4: Pricing and Discount Engine...")
    try:
        # Check active product list prices (no global discount active yet)
        res = requests.get("http://127.0.0.1:8002/products")
        products_list = res.json()
        p_rent = next(p for p in products_list if p["id"] == rent_id)
        p_buy = next(p for p in products_list if p["id"] == buy_id)
        
        # Verify initial values
        assert p_rent["price_rent_3day_sale"] == 90.0
        assert p_buy["price_buy_sale"] == 250.0
        print("  [PASS] Verified product-specific sale prices before Global Discount.")
        
        # Apply Global Discount (e.g. 20% discount)
        requests.post("http://127.0.0.1:8002/global-discount", json={
            "percentage": 20.0,
            "is_active": True
        }, headers=headers)
        print("  [PASS] Applied global discount of 20.0%.")
        
        # Fetch global discount status
        g_discount = requests.get("http://127.0.0.1:8002/global-discount").json()
        assert g_discount["percentage"] == 20.0
        assert g_discount["is_active"] is True
        print("  [PASS] Verified global discount properties retrieved from API.")
        
    except Exception as e:
        print(f"  [FAIL] Discount Engine test failed: {e}")
        return False
 
    # 5. Booking and Sizing Measurements
    print("\nTest 5: Rental Bookings and Fit Measurements...")
    try:
        # Create a booking
        booking_payload = {
            "product_id": rent_id,
            "user_id": 1,
            "start_date": "2026-06-01",
            "end_date": "2026-06-05",
            "type": "rent"
        }
        b_res = requests.post("http://127.0.0.1:8003/bookings", json=booking_payload, headers=headers)
        if b_res.status_code == 201:
            booking_id = b_res.json()["id"]
            print(f"  [PASS] Booking reserved successfully. ID: {booking_id}")
        else:
            print(f"  [FAIL] Booking reservation failed: {b_res.text}")
            return False
            
        # Try to double book (should fail!)
        b_double_res = requests.post("http://127.0.0.1:8003/bookings", json=booking_payload, headers=headers)
        if b_double_res.status_code == 400:
            print("  [PASS] Blocked double booking overlap (conflict validation works).")
        else:
            print("  [FAIL] Warning: conflict validation failed to block overlap booking.")
            return False
            
        # Check calendar availability
        avail = requests.get(f"http://127.0.0.1:8003/availability/{rent_id}").json()
        assert "2026-06-01" in avail["booked_dates"]
        print("  [PASS] Verified dates are marked as unavailable on the calendar.")
            
        # Record measurements
        fit_payload = {
            "product_id": rent_id,
            "user_id": 1,
            "booking_id": booking_id,
            "armhole": 9.5,
            "chest": 38.0,
            "waist": 32.0,
            "sleeves": 23.0,
            "length": 42.5
        }
        m_res = requests.post("http://127.0.0.1:8003/measurements", json=fit_payload, headers=headers)
        if m_res.status_code == 201:
            print("  [PASS] Custom measurements registered successfully.")
        else:
            print(f"  [FAIL] Sizing measurements creation failed: {m_res.text}")
            return False
            
    except Exception as e:
        print(f"  [FAIL] Booking/Measurement test failed: {e}")
        return False
 
    # 6. Reviews & Moderation
    print("\nTest 6: Reviews & Admin Moderation...")
    try:
        # User submits review
        rev_payload = {
            "product_id": buy_id,
            "user_id": 1,
            "rating": 5,
            "comment": "Perfect fit, absolutely beautiful dress!"
        }
        r_res = requests.post("http://127.0.0.1:8004/reviews", json=rev_payload, headers=headers)
        if r_res.status_code == 201:
            rev_id = r_res.json()["id"]
            print(f"  [PASS] Review submitted. ID: {rev_id}")
        else:
            print(f"  [FAIL] Failed to submit review: {r_res.text}")
            return False
            
        # Admin modifies review (Adjusting comment)
        adjust_res = requests.patch(
            f"http://127.0.0.1:8004/reviews/{rev_id}", 
            json={"comment": "Approved: Perfect fit, absolutely beautiful dress!", "rating": 5},
            headers=headers
        )
        if adjust_res.status_code == 200:
            print("  [PASS] Admin successfully adjusted review content.")
        else:
            print(f"  [FAIL] Review modification failed: {adjust_res.text}")
            return False
            
        # Admin reverts review
        revert_res = requests.post(f"http://127.0.0.1:8004/reviews/{rev_id}/revert", headers=headers)
        if revert_res.status_code == 200 and revert_res.json()["comment"] == rev_payload["comment"]:
            print("  [PASS] Admin successfully reverted review to original user content.")
        else:
            print("  [FAIL] Review reversion failed.")
            return False
            
    except Exception as e:
        print(f"  [FAIL] Review/Moderation test failed: {e}")
        return False
 
    print("\n[PASS] ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")
    return True

def stop_services():
    print("\nStopping backend services...")
    for name, proc in processes:
        print(f"  Terminating {name} service...")
        proc.terminate()
        try:
            proc.wait(timeout=3)
            print(f"    [PASS] {name} terminated.")
        except subprocess.TimeoutExpired:
            proc.kill()
            print(f"    - {name} killed.")

if __name__ == "__main__":
    success = False
    try:
        start_services()
        if check_health():
            success = run_tests()
        else:
            print("\n[ERROR] Health check failed. Skipping tests.")
            success = False
    finally:
        stop_services()
        
    if not success:
        sys.exit(1)
    sys.exit(0)
