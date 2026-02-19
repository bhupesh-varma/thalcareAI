import json
import random
import pandas as pd
import uuid
from datetime import datetime
from faker import Faker

fake = Faker()

with open("data/raw_osm_data.json") as f:
    raw = json.load(f)

def trauma_level(name):
    name = name.lower()
    if "research" in name or "general" in name:
        return 1
    if "medical" in name:
        return 2
    return 3

blood_types = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

processed = []

for r in raw:
    tags = r.get("tags", {})
    name = tags.get("name", "Unknown Hospital")

    record = {
        "id": str(uuid.uuid4()),
        "name": name,
        "lat": r.get("lat"),
        "lon": r.get("lon"),
        "address": tags.get("addr:full", ""),
        "city": r.get("city"),
        "type": "blood_bank" if "blood" in name.lower() else "hospital",
        "trauma_level": trauma_level(name),
        "rating": round(random.uniform(3.5, 5.0), 2),
        "avg_response_time_mins": random.randint(10, 60),
        "icu_beds_available": random.randint(0, 10),
        "verified_status": random.random() > 0.2,
        "phone": fake.phone_number(),
        "website": fake.url(),
        "last_updated": datetime.utcnow().isoformat()
    }

    inventory = {}
    for bt in blood_types:
        inventory[bt] = random.randint(0, 25)

    record["blood_inventory"] = inventory

    processed.append(record)

# Save JSON
with open("data/processed_hospitals.json", "w") as f:
    json.dump(processed, f, indent=2)

# Save CSV
df = pd.json_normalize(processed)
df.to_csv("data/processed_hospitals.csv", index=False)

print(f"Generated {len(processed)} enriched records.")
