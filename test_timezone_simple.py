#!/usr/bin/env python3
"""
Simple test to understand timezone offset calculation
"""
from datetime import datetime, timedelta

print("=== Timezone Offset Test ===")

# Current times
utc_now = datetime.utcnow()
local_now = datetime.now()

print(f"UTC time: {utc_now}")
print(f"Server local time: {local_now}")

# Calculate the difference
diff = local_now - utc_now
offset_minutes = int(diff.total_seconds() / 60)

print(f"Server timezone offset: {offset_minutes} minutes")

# Test different JavaScript timezone offsets
# JavaScript getTimezoneOffset() returns:
# - Positive values for timezones behind UTC (e.g., +300 for EST which is UTC-5)
# - Negative values for timezones ahead of UTC (e.g., -540 for JST which is UTC+9)

test_offsets = [
    ("EST (UTC-5)", 300),    # JavaScript returns +300 for EST
    ("PST (UTC-8)", 480),    # JavaScript returns +480 for PST  
    ("JST (UTC+9)", -540),   # JavaScript returns -540 for JST
    ("UTC", 0),              # JavaScript returns 0 for UTC
]

print(f"\n=== Testing Different Offsets ===")
for name, js_offset in test_offsets:
    # What frontend sends (js_offset * -1)
    frontend_sends = js_offset * -1
    
    # Backend calculation
    backend_local = utc_now + timedelta(minutes=frontend_sends)
    
    print(f"{name}:")
    print(f"  JS getTimezoneOffset(): {js_offset}")
    print(f"  Frontend sends: {frontend_sends}")
    print(f"  Backend calculates: {backend_local}")
    print(f"  Backend date: {backend_local.date()}")
    print(f"  Backend day: {backend_local.strftime('%a')}")
    print()

# Test with current system
print(f"=== Current System Test ===")
# Simulate what a user in EST would send
est_js_offset = 300  # JavaScript getTimezoneOffset() for EST
frontend_sends_est = est_js_offset * -1  # -300
backend_calculates_est = utc_now + timedelta(minutes=frontend_sends_est)

print(f"EST user scenario:")
print(f"  JavaScript getTimezoneOffset(): {est_js_offset}")
print(f"  Frontend sends to backend: {frontend_sends_est}")
print(f"  Backend UTC time: {utc_now}")
print(f"  Backend calculated local time: {backend_calculates_est}")
print(f"  Should match EST time: {utc_now - timedelta(hours=5)}")