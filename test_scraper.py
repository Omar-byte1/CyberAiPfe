from backend.parse_engine import ParseEngine

engine = ParseEngine()
url = "https://thehackernews.com/"
print(f"Scraping: {url}...")
import requests
response = requests.get(url, headers=engine.headers, timeout=15)
print(f"Status Code: {response.status_code}")
print(f"HTML Preview (first 1000 chars):\n{response.text[:1000]}")
text = engine.scrape_url(url)
print("\n--- Extracted Text ---")
print(text)
