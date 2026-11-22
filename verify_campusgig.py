import requests
import json

BASE_URL = "http://127.0.0.1:8001/api"

def print_result(test_name, passed, detail=""):
    mark = "✅ PASS" if passed else "❌ FAIL"
    print(f"{mark} | {test_name}: {detail}")

def run_tests():
    print("=" * 70)
    print("CAMPUSGIG E2E INTEGRATION & WORKFLOW VERIFICATION TEST SUITE")
    print("=" * 70)

    # 1. Health check
    h = requests.get(f"{BASE_URL}/health")
    print_result("TEST 1", h.status_code == 200, f"Backend API Health Check ({h.json().get('status')})")

    # 2. Admin Login
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "Admin@CampusGig2026"
    })
    admin_ok = admin_login.status_code == 200 and "access_token" in admin_login.json()
    admin_token = admin_login.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print_result("TEST 2", admin_ok, f"Admin Logged In successfully (Role: {admin_login.json().get('user', {}).get('role')})")

    # 3. Student Registration / Login
    student_username = "ananya_cse"
    student_pwd = "Student@2026"
    reg = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "ananya@example.com",
        "username": student_username,
        "password": student_pwd,
        "full_name": "Ananya Mukherjee",
        "phone": "9811223344",
        "student_type": "college",
        "college_name": "BITS Pilani",
        "college_branch": "CSE"
    })
    # If already registered, login
    student_login = requests.post(f"{BASE_URL}/auth/login", json={
        "username": student_username,
        "password": student_pwd
    })
    student_ok = student_login.status_code == 200 and "access_token" in student_login.json()
    student_token = student_login.json().get("access_token")
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print_result("TEST 3", student_ok, f"Student Logged In ({student_login.json().get('user', {}).get('full_name')} - {student_login.json().get('user', {}).get('college_name')})")

    # 4. Price Calculation with Addons (PPT + Report)
    calc = requests.post(f"{BASE_URL}/orders/calculate-price", json={
        "category_key": "college_ml",
        "deliverables": ["code", "ppt", "report"],
        "urgency": "normal"
    })
    p_data = calc.json()
    calc_ok = calc.status_code == 200 and p_data.get("total") == (p_data.get("base_price") + p_data.get("addons_total")) and p_data.get("advance") == round(p_data.get("total") * 0.3, 2)
    print_result("TEST 4", calc_ok, f"Price Calculation: Base ₹{p_data.get('base_price')} + Addons ₹{p_data.get('addons_total')} = Total ₹{p_data.get('total')} (30% Adv: ₹{p_data.get('advance')}, 70% Bal: ₹{p_data.get('balance')})")

    # 5. AI Scope Proposal Generation
    ai_req = requests.post(f"{BASE_URL}/orders/refine-scope", json={
        "project_title": "Crop Recommendation System using Soil NPK values",
        "domain": "Machine Learning",
        "deliverables": ["code", "ppt", "report"],
        "student_type": "college",
        "notes": "User enters Nitrogen, Phosphorus, Potassium and gets best crop prediction with confidence score"
    })
    ai_data = ai_req.json()
    ai_ok = ai_req.status_code == 200 and "tech_stack" in ai_data and len(ai_data["tech_stack"]) > 0
    print_result("TEST 5", ai_ok, f"AI Scope Proposal Generated: '{ai_data.get('refined_title')}' with Tech: {ai_data.get('tech_stack')[:3]}")

    # 6. Student creates order & books with 30% advance
    order_create = requests.post(f"{BASE_URL}/orders", json={
        "category_key": "college_ml",
        "project_title": ai_data.get("refined_title"),
        "description": "Final Year Capstone Project with interactive UI and Random Forest Classifier",
        "domain": "college_ml",
        "deliverables": ["code", "ppt", "report"],
        "urgency": "normal",
        "payment_method": "upi",
        "student_notes": "UTR: 412356789012 - 30% advance paid",
        "ai_refined_scope": json.dumps(ai_data)
    }, headers=student_headers)
    created_order = order_create.json()
    order_ok = order_create.status_code == 201 and "order_number" in created_order
    order_id = created_order.get("id")
    print_result("TEST 6", order_ok, f"Project Order #{created_order.get('order_number')} created successfully!")

    # 7. Confirm 30% Advance Payment with UTR
    confirm_adv = requests.put(f"{BASE_URL}/orders/{order_id}/confirm-payment", json={
        "payment_method": "upi",
        "utr_number": "412356789012"
    }, headers=student_headers)
    order_updated = confirm_adv.json()
    adv_ok = confirm_adv.status_code == 200 and order_updated.get("status") == "advance_paid"
    print_result("TEST 7", adv_ok, f"30% Advance Payment Verified (Status: {order_updated.get('status')})")

    # 8. Student sends message to Mentor
    msg_student = requests.post(f"{BASE_URL}/chat/messages", json={
        "order_id": order_id,
        "content": "Hi Mentor! I have paid the 30% advance. Can we add a dark mode theme to the dashboard?",
        "message_type": "text"
    }, headers=student_headers)
    s_msg_ok = msg_student.status_code == 200
    print_result("TEST 8", s_msg_ok, f"Student Message sent to Workspace: '{msg_student.json().get('content')}'")

    # 9. Mentor/Admin replies in workspace
    msg_mentor = requests.post(f"{BASE_URL}/chat/messages", json={
        "order_id": order_id,
        "content": "Hello Ananya! Advance confirmed. Yes, dark mode and Random Forest accuracy charts are added!",
        "message_type": "text"
    }, headers=admin_headers)
    m_msg_ok = msg_mentor.status_code == 200
    print_result("TEST 9", m_msg_ok, f"Mentor Replied in Live Workspace: '{msg_mentor.json().get('content')}'")

    # 10. Fetch Chat History
    chat_hist = requests.get(f"{BASE_URL}/chat/messages/{order_id}", headers=student_headers)
    hist_ok = chat_hist.status_code == 200 and len(chat_hist.json()) >= 2
    print_result("TEST 10", hist_ok, f"Chat History synced ({len(chat_hist.json())} live messages recorded)")

    # 11. Admin updates status to 'ready_for_review'
    admin_stat = requests.put(f"{BASE_URL}/orders/{order_id}/status", json={
        "status": "ready_for_review",
        "admin_notes": "Completed source code, generated IEEE report and 18-slide PPT."
    }, headers=admin_headers)
    rev_ok = admin_stat.status_code == 200 and admin_stat.json().get("status") == "ready_for_review"
    print_result("TEST 11", rev_ok, f"Admin updated order to '{admin_stat.json().get('status')}'")

    # 12. Student confirms final 70% balance payment
    balance_pay = requests.put(f"{BASE_URL}/orders/{order_id}/confirm-completion", json={
        "payment_method": "upi",
        "utr_number": "789012345678"
    }, headers=student_headers)
    comp_ok = balance_pay.status_code == 200 and balance_pay.json().get("status") == "completed"
    print_result("TEST 12", comp_ok, f"70% Balance Paid (Status: {balance_pay.json().get('status')} - 100% Unlocked)")

    # 13. Admin Dashboard KPIs live query
    dash = requests.get(f"{BASE_URL}/admin/dashboard", headers=admin_headers)
    d_data = dash.json()
    dash_ok = dash.status_code == 200 and d_data.get("stats", {}).get("total_orders", 0) >= 1
    print_result("TEST 13", dash_ok, f"Admin Dashboard Stats: Total Orders={d_data.get('stats', {}).get('total_orders')}, Total Revenue=₹{d_data.get('stats', {}).get('total_revenue')}")

    # 14. Admin Pricing Management: Update rate card
    update_price = requests.put(f"{BASE_URL}/admin/pricing/1", json={
        "base_price": 1600.0,
        "unit_description": "Per ML Project (Standard)"
    }, headers=admin_headers)
    price_ok = update_price.status_code == 200
    print_result("TEST 14", price_ok, "Admin modified ML Base Price dynamically in DB")

    # 15. Student Directory Listing
    students_list = requests.get(f"{BASE_URL}/admin/students", headers=admin_headers)
    stu_ok = students_list.status_code == 200 and len(students_list.json().get("students", [])) >= 1
    print_result("TEST 15", stu_ok, f"Student Directory returned {len(students_list.json().get('students', []))} registered students")

    # 16. Courses Catalog
    courses_res = requests.get(f"{BASE_URL}/courses")
    courses_ok = courses_res.status_code == 200
    print_result("TEST 16", courses_ok, f"Courses catalog endpoint verified ({len(courses_res.json())} active masterclasses)")

    print("=" * 70)
    all_pass = all([h.status_code == 200, admin_ok, student_ok, calc_ok, ai_ok, order_ok, adv_ok, s_msg_ok, m_msg_ok, hist_ok, rev_ok, comp_ok, dash_ok, price_ok, stu_ok, courses_ok])
    if all_pass:
        print("🏆 ALL 16 COMPREHENSIVE CAMPUSGIG PRODUCTION TESTS PASSED PERFECTLY!")
    else:
        print("⚠️ Some tests encountered issues.")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
