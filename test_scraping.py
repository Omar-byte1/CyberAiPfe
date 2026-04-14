from backend.parse_engine import ParseEngine
import json
import asyncio
import traceback
import sys

async def test_engine():
    url = "https://cybernews.com/news/uk-threatens-tech-execs-online-porn/"
    print(f"Testing ParseEngine for: {url}")
    
    engine = ParseEngine()
    
    print("\n--- Phase 1: Scraping ---")
    try:
        content = await engine.scrape_url(url)
        
        if content.startswith("Error:"):
            print(f"Scraping result: {content}")
        else:
            print("Scraping successful! Content preview:")
            print(content[:300] + "...")
            
            print("\n--- Phase 2: CTI Generation ---")
            event = await engine.generate_cti_event(content, url)
            print(json.dumps(event, indent=2))
    except Exception as e:
        print("EXCEPTION CAUGHT:")
        traceback.print_exc()

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(test_engine())
