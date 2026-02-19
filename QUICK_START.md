# Emergency Hospital Finder - Quick Start Guide

## 30-Second Overview

Emergency Hospital Finder is a full-stack application that helps users find the best hospitals during critical situations using:
- **Natural language queries** ("urgent accident with O+ blood needed")
- **Structured form search** (city, blood type, emergency type)
- **Automatic location detection** (browser geolocation or interactive map)
- **AI-powered explanations** (why each hospital is recommended)
- **User feedback collection** (to improve recommendations)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend API | FastAPI (Python) + PostgreSQL |
| Frontend UI | React 19 + Vite + Tailwind CSS |
| Map Integration | Leaflet (OpenStreetMap) |
| HTTP Client | Axios |
| Icons | Lucide React |
| LLM | OLLAMA (local) |

## First-Time Setup (5 minutes)

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start Ollama (in separate terminal)
ollama serve

# Start FastAPI server
cd /workspaces/thalcareAI
uvicorn api.main:app --reload

# Server running at http://localhost:8000
```

Verify with:
```bash
curl http://localhost:8000/docs
```

### 2. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
npm run dev

# App running at http://localhost:5173
```

Open browser: `http://localhost:5173`

## Testing the App (2 minutes)

### Test Flow

1. **Allow Geolocation**
   - Browser will ask for location access
   - Click "Allow" 
   - App auto-detects your city

2. **Test Quick Prompt**
   - In "Quick Prompt" tab
   - Click suggestion: "Urgent accident needs O+ blood"
   - Click "Find Hospitals"
   - See ~5 hospital recommendations

3. **Rate a Hospital**
   - Click "Select Hospital" on any result
   - Click "Yes" for "Was this helpful?"
   - Add comment (optional)
   - Click "Submit Feedback"
   - See success message

4. **Test Form Search**
   - Switch to "Form Search" tab
   - Select different city from dropdown
   - Change blood type (try A+)
   - Select "Trauma / Injury"
   - Click "Search Hospitals"
   - See different results

5. **Test Manual Location**
   - Close app and reopen
   - Deny geolocation (click "Block")
   - Map picker opens automatically
   - Search for "Bangalore"
   - Click on map to drop pin
   - Click "Confirm Location"
   - App works normally with new location

## File Structure Reference

```
/workspaces/thalcareAI/
├── api/main.py                      # FastAPI backend with /recommend and /feedback
├── frontend/                         # React application
│   ├── src/
│   │   ├── App.tsx                 # Main app (state, modals, layout)
│   │   ├── components/
│   │   │   ├── MapPicker.tsx       # Location selector
│   │   │   ├── PromptSearch.tsx    # Natural language search
│   │   │   ├── SearchForm.tsx      # Structured search
│   │   │   ├── HospitalCard.tsx    # Result display
│   │   │   └── FeedbackModal.tsx   # Feedback collection
│   │   ├── index.css               # Tailwind + custom styles
│   │   └── main.tsx                # React entry point
│   ├── package.json                # Dependencies (React, Vite, Tailwind, etc.)
│   └── vite.config.ts              # Build config
├── SETUP_GUIDE.md                  # Detailed setup instructions
├── API_DOCUMENTATION.md            # API endpoint reference
├── FRONTEND_COMPONENTS.md          # Component architecture
└── docker-compose.yml              # Docker setup (optional)
```

## Key Features Explained

### 1. Two Search Modes

**Quick Prompt** (for emergencies):
```
User types: "Heavy bleeding after car accident, need O+ urgently"
↓
App extracts: city, blood type, severity from natural language
↓
Calls /recommend with the text
↓
Backend uses embeddings to find matching hospitals
```

**Form Search** (for detailed info):
```
User selects:
  - City: Mumbai
  - Blood Type: AB-
  - Emergency: Traffic Accident
  - Details: "Unconscious patient"
↓
App constructs structured query
↓
Calls /recommend with all fields
↓
Backend recommends based on structured data
```

### 2. Location Detection

```
App loads
↓
Browser: "Can we use your location?"
↓
User grants → Get latitude/longitude → Reverse geocode to city
↓
App ready, knows user city automatically

OR

User denies → MapPicker modal shows
↓
User searches "Delhi" or drops pin on map
↓
Confirm location → App proceeds
```

### 3. Hospital Results

Each recommendation shows:
```
🏥 Apollo Hospital Delhi
⭐ 4.2 rating  |  📍 2.1 km away

⏱️  19 min response time
❤️  8 ICU beds available
🩸 6 blood units (O+)

"This hospital is highly recommended..."

[    Select Hospital    ]  ← Click to feed back
```

### 4. Feedback System

```
Click "Select Hospital"
↓
Modal: "Was this recommendation helpful?"
↓
User clicks: Yes ✓  or No ✗
↓
Optional: "Tell us why..."
↓
Submit → Success → Auto-close after 2 sec
↓
Feedback saved in PostgreSQL (id, hospital, rating, comment, location, timestamp)
```

## API Endpoints Reference

### POST /recommend (Find Hospitals)

**Request:**
```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Delhi",
    "blood_type": "blood_o_pos",
    "query": "accident urgent O+ blood",
    "user_lat": 28.6139,
    "user_lon": 77.2090
  }'
```

**Response:**
```json
{
  "recommendations": [
    {
      "name": "Apollo Hospital",
      "rating": 4.2,
      "response": 19,
      "icu": 8,
      "blood": 6,
      "distance": 2.1,
      "explanation": "Recommended because close and has sufficient ICU beds..."
    }
  ]
}
```

### POST /feedback (Submit Feedback)

**Request:**
```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "hospital": "Apollo Hospital",
    "rating": true,
    "comment": "Great service!",
    "user_lat": 28.6139,
    "user_lon": 77.2090
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Feedback recorded successfully"
}
```

## Backend Architecture

```
User Request
    ↓
FastAPI /recommend endpoint
    ↓
    ├─→ embed(query) → OLLAMA embeddings
    ├─→ PostgreSQL hybrid_search()
    │   ├─ Vector search (query embedding)
    │   ├─ Distance calculation (haversine formula)
    │   ├─ Response time factor
    │   └─ Hospital rating factor
    ├─→ explain(hospital) → OLLAMA LLM
    └─→ Return top 5 hospitals with explanations
    ↓
JSON Response
```

## Frontend Architecture

```
App (Main Component)
├─ State Management (hooks)
│  ├─ Location (lat/lon/city)
│  ├─ Search (bloodType, activeTab)
│  ├─ Results (hospitals, loading, error)
│  └─ Modals (mapPicker, feedback)
├─ Effects (geolocation on mount)
├─ Event Handlers
│  ├─ handleSearch() → axios call
│  ├─ handleSubmitFeedback() → axios call
│  └─ handleSelectHospital() → show feedback
├─ Conditional Rendering
│  ├─ Location loading screen
│  ├─ Modals (MapPicker, FeedbackModal)
│  └─ Results display
└─ Sub-components
   ├─ SearchForm OR PromptSearch (based on tab)
   ├─ HospitalCard (for each result)
   ├─ MapPicker (location selection)
   └─ FeedbackModal (feedback collection)
```

## Common Tasks

### Change Backend URL
**File**: `frontend/.env`
```
VITE_API_URL=http://your-backend-url:8000
```

### Add New City
**File**: `frontend/src/components/SearchForm.tsx`
Search for `INDIAN_CITIES` and add to array.

### Change Emergency Types
**File**: `frontend/src/components/SearchForm.tsx`
Modify `EMERGENCY_TYPES` array.

### Adjust Hospital Result Count
**File**: `api/main.py`
Change `LIMIT 5` in SQL query to different number.

### Modify Ranking Algorithm
**File**: `api/main.py`
Adjust weights in ORDER BY clause (currently 0.5 vector, 0.3 distance, 0.1 response, 0.1 rating).

## Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| "Cannot connect to API" | Check backend running on port 8000 |
| "Geolocation not working" | Click "Change Location" and use map picker |
| "No hospitals found" | Try different city or looser query description |
| "Map not loading" | Check internet, refresh page, clear cache |
| "Styles look broken" | Run `npm install` again, check Tailwind CSS loaded |
| "Slow response" | Ensure OLLAMA is running, check DB connection |

## Performance Baseline

- **First load**: 2-3 seconds (geolocation + reverse geocode)
- **Search request**: 3-5 seconds (depends on OLLAMA)
- **Feedback submission**: <1 second
- **Map loading**: 1-2 seconds (first time)

## Environment Variables

### Backend (.env)
```
DB_NAME=thalcare
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
OLLAMA_MODEL=nomic-embed-text
EXPLAIN_MODEL=mistral
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

## Deployment Quick Reference

### Frontend (Netlify/Vercel)
```bash
cd frontend
npm run build
# Deploy 'dist' folder
```

### Backend (Docker)
```bash
docker build -t thalcare-api -f Dockerfile.backend .
docker run -p 8000:8000 \
  -e DB_NAME=thalcare \
  -e DB_USER=postgres \
  -e DB_PASSWORD=secret \
  thalcare-api
```

### Full Stack (Docker Compose)
```bash
docker-compose up -d
# Access at http://localhost:5173
```

## Code Style & Best Practices

- **TypeScript**: All components use TypeScript for type safety
- **Component Structure**: One component per file
- **State Management**: React hooks (useState, useEffect)
- **Styling**: Tailwind utilities + custom CSS in index.css
- **Formatting**: Use Prettier (configured in Vite)
- **Naming**: camelCase for functions, PascalCase for components

## Testing Scenarios

### Scenario 1: Emergency Response
1. User gets in accident
2. Quickly types natural language description
3. App shows nearest, best-rated hospitals with trauma centers
4. User selects one and provides feedback

### Scenario 2: Planned Hospital Search
1. Patient needs specific blood type
2. Uses form to select city and emergency type
3. Reviews all matching hospitals
4. Can compare distance, ICU, blood availability

### Scenario 3: Offline Location
1. Geolocation disabled or unavailable
2. User picks location from interactive map
3. Search works normally with map-selected location
4. Feedback includes the picked location coordinates

## Next Steps

1. ✅ Run both servers (backend + frontend)
2. ✅ Test the complete flow (search → select → feedback)
3. ✅ Check API documentation for endpoint details
4. ✅ Review component documentation for UI details
5. ✅ Deploy to production using Docker/Netlify guides
6. ✅ Monitor feedback database for improvement insights

## Support Resources

- **Setup Issues**: See SETUP_GUIDE.md
- **API Questions**: See API_DOCUMENTATION.md
- **Component Details**: See FRONTEND_COMPONENTS.md
- **Code**: Check inline comments in component files

## Additional Notes

- **CORS**: Backend allows all origins (restrict for production)
- **Authentication**: Not implemented (add JWT for production)
- **Rate Limiting**: Not implemented (add for production)
- **Logging**: Check browser console and server logs
- **Database**: Feedback table auto-created on first use

## Quick Command Reference

```bash
# Terminal 1: Start Backend
cd /workspaces/thalcareAI
uvicorn api.main:app --reload

# Terminal 2: Start Frontend (different terminal)
cd /workspaces/thalcareAI/frontend
npm run dev

# Terminal 3: Start OLLAMA (if needed)
ollama serve

# View logs
# Backend: Terminal 1 output
# Frontend: Terminal 2 output
# Database: Check PostgreSQL logs
```

---

**Happy Emergency Hospital Hunting!** 🏥💪

For detailed information, refer to:
- SETUP_GUIDE.md
- API_DOCUMENTATION.md
- FRONTEND_COMPONENTS.md
