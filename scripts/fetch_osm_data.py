import requests
import json
import time

CITIES = [
    "Delhi", "Mumbai", "Bangalore", "Chennai",
    "Kolkata", "Hyderabad", "Pune", "Ahmedabad"
]

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

def build_query(city):
    return f"""
    [out:json][timeout:25];
    area["name"="{city}"]->.searchArea;
    (
      node["amenity"="hospital"](area.searchArea);
      node["healthcare"="blood_bank"](area.searchArea);
    );
    out tags center;
    """

all_results = []

for city in CITIES:
    print(f"Fetching {city}...")

    query = build_query(city)
    response = requests.post(OVERPASS_URL, data={"data": query})
    response.raise_for_status()

    data = response.json()

    for el in data.get("elements", []):
        el["city"] = city
        all_results.append(el)

    time.sleep(5)  # rate limiting

with open("data/raw_osm_data.json", "w", encoding="utf-8") as f:
    json.dump(all_results, f, indent=2)

print(f"Saved {len(all_results)} locations to data/raw_osm_data.json")
