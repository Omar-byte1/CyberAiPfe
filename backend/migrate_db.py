import os
import sys
import json

from passlib.context import CryptContext

# Import paths configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from backend.database import SessionLocal, Base, engine
from backend.models import User, CTIEvent, Incident

from datetime import datetime
import dateutil.parser

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def main():
    print("Creating tables in SQLite...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Create Default Admin User
    admin_user = db.query(User).filter(User.username == "soc").first()
    if not admin_user:
        print("Creating admin user 'soc'...")
        admin_user = User(
            username="soc",
            password_hash=pwd_context.hash("soc123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
    else:
        print("Admin user 'soc' already exists.")

    # 2. Migrate CTI Events from JSON
    cti_json_path = os.path.join(BASE_DIR, "data", "cti_events.json")
    if os.path.exists(cti_json_path):
        with open(cti_json_path, "r", encoding="utf-8") as f:
            try:
                events_data = json.load(f)
            except Exception as e:
                print(f"Error loading JSON: {e}")
                events_data = []
        
        # Check if events already exist
        existing_count = db.query(CTIEvent).count()
        if existing_count == 0 and events_data:
            print(f"Migrating {len(events_data)} events to SQLite...")
            for ev in events_data:
                # Store the whole object as JSON string in 'content'
                db_event = CTIEvent(
                    url=ev.get("website", "Unknown URL"),
                    content=json.dumps(ev),
                    owner_id=admin_user.id
                )
                db.add(db_event)
            db.commit()
            print("Migration of CTI events completed.")
        else:
            print(f"No migration needed or SQLite already contains {existing_count} events.")
    # 3. Migrate Incidents from JSON
    incidents_json_path = os.path.join(BASE_DIR, "data", "incidents.json")
    if os.path.exists(incidents_json_path):
        with open(incidents_json_path, "r", encoding="utf-8") as f:
            try:
                incidents_data = json.load(f)
            except Exception as e:
                print(f"Error loading Incidents JSON: {e}")
                incidents_data = []
        
        existing_inc_count = db.query(Incident).count()
        if existing_inc_count == 0 and incidents_data:
            print(f"Migrating {len(incidents_data)} incidents to SQLite...")
            for inc in incidents_data:
                # Parse timestamp if exists, else now
                ts_str = inc.get("timestamp")
                try:
                    ts = dateutil.parser.isoparse(ts_str) if ts_str else datetime.utcnow()
                except:
                    ts = datetime.utcnow()

                db_inc = Incident(
                    external_id=inc.get("id", f"INC-{os.urandom(4).hex()}"),
                    type=inc.get("type", "Unknown"),
                    verdict=inc.get("verdict", "Unknown"),
                    risk_score=inc.get("risk_score", 0),
                    timestamp=ts,
                    details=json.dumps(inc.get("details", {})),
                    owner_id=admin_user.id
                )
                db.add(db_inc)
            db.commit()
            print("Migration of incidents completed.")
        else:
            print(f"No incident migration needed or SQLite already contains {existing_inc_count} incidents.")
    else:
        print(f"JSON file {incidents_json_path} not found.")

    db.close()
    print("Migration finished completely.")

if __name__ == "__main__":
    main()
