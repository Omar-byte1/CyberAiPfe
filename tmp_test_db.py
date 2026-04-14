import os
import sys

# Setup path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from backend.database import SessionLocal, engine
from backend.models import Incident, User

def test():
    db = SessionLocal()
    try:
        print("Querying incidents...")
        incidents = db.query(Incident).all()
        print(f"Found {len(incidents)} incidents.")
        for inc in incidents:
            print(f"ID: {inc.id}, External ID: {inc.external_id}, Timestamp: {inc.timestamp}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
