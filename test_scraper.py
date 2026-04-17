import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("SCRAPER_API_KEY")
url = "https://thehackernews.com"

print(f"Testing ScraperAPI with key: {api_key[:5]}...")

# Test 1: https with slash
print("\nTest 1: https://api.scraperapi.com/")
try:
    r1 = requests.get("https://api.scraperapi.com/", params={"api_key": api_key, "url": url})
    print(f"Status: {r1.status_code}")
    print(f"Body snippet: {r1.text[:100]}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: http with slash
print("\nTest 2: http://api.scraperapi.com/")
try:
    r2 = requests.get("http://api.scraperapi.com/", params={"api_key": api_key, "url": url})
    print(f"Status: {r2.status_code}")
    print(f"Body snippet: {r2.text[:100]}")
except Exception as e:
    print(f"Error: {e}")

# Test 3: https without slash (The one that reportedly worked)
print("\nTest 3: https://api.scraperapi.com (With extra params)")
try:
    params = {
        "api_key":    api_key,
        "url":        url,
        "render":     "true",
        "premium":    "true",
        "country_code": "us",
    }
    r3 = requests.get("https://api.scraperapi.com", params=params)
    print(f"Status: {r3.status_code}")
    print(f"Body snippet: {r3.text[:100]}")
except Exception as e:
    print(f"Error: {e}")

