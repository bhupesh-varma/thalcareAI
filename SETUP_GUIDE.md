# Emergency Hospital Finder - Setup & Quick Start Guide

## Overview

This project is a complete emergency hospital recommendation system with:
- **Backend**: FastAPI server with hybrid search (vector embeddings + geolocation)
- **Frontend**: Modern React + Vite UI with two search modes
- **Feedback System**: PostgreSQL-backed user feedback collection

## Prerequisites

- **Backend Requirements**:
  - Python 3.9+
  - PostgreSQL 12+
  - OLLAMA (for embeddings and LLM)
  - Redis (optional, for caching)

- **Frontend Requirements**:
  - Node.js 16+
  - npm or yarn

## Project Structure

```
thalcareAI/
├── api/
│   ├── main.py                 # FastAPI backend
│   └── __init__.py
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── App.tsx             # Main app
│   │   └── index.css           # Tailwind + global styles
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── scripts/
│   └── *.py                    # Data ingestion scripts
├── data/
│   ├── processed_hospitals.json
│   └── processed_hospitals.csv
└── requirements.txt            # Python dependencies
```

## Backend Setup

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Add CORS to Backend

The `api/main.py` file has been updated with CORS middleware:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Feedback Endpoint Added

New POST `/feedback` endpoint automatically creates and populates the feedback table:

```python
@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    # Creates feedback table if needed
    # Stores: hospital, rating, comment, lat, lon, created_at
```

### 4. Start Backend Server

```bash
cd /workspaces/thalcareAI
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### API Endpoints

**POST `/recommend`**
Find hospitals based on user emergency and location
```json
{
  "city": "Delhi",
  "blood_type": "blood_o_pos",
  "query": "urgent accident with trauma",
  "user_lat": 28.6139,
  "user_lon": 77.2090
}
```

**POST `/feedback`**
Submit feedback about hospital recommendation
```json
{
  "hospital": "Hospital Name",
  "rating": true,
  "comment": "Great service",
  "user_lat": 28.6139,
  "user_lon": 77.2090
}
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

The `.env` file is already configured:
```
VITE_API_URL=http://localhost:8000
```

For production, update to your backend URL.

### 3. Start Development Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## Frontend Features

### Two Search Modes

**Quick Prompt Mode**
- Type emergency in natural language
- Includes quick suggestion buttons
- Shows blood type and city
- Suitable for urgent situations

**Form Search Mode**
- Structured search with dropdowns
- City autocomplete from major Indian cities
- Blood type selector (all 8 types)
- Emergency type selection (accident, trauma, surgery, etc.)
- Optional additional details

### Location Detection

1. On page load, browser requests geolocation
2. If granted:
   - Gets coordinates
   - Reverse geocodes to city name
   - Uses for hospital search

3. If denied:
   - Shows interactive Leaflet map
   - User can search city or drop pin
   - Click "Confirm Location" to proceed

### Hospital Recommendations

Results show:
- Hospital name with star rating
- Distance in km
- Response time (minutes)
- ICU beds available
- Blood units available
- AI-generated explanation from Ollama

Each hospital card has "Select Hospital" button to provide feedback.

### Feedback Flow

1. Click "Select Hospital" on any result
2. Feedback modal opens with:
   - Hospital name confirmation
   - Yes/No helpful rating buttons
   - Optional comment textarea
3. Show success confirmation
4. Feedback saved to PostgreSQL
5. Modal auto-closes after 2 seconds

## Database Setup

The feedback table is automatically created when first used:

```sql
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    hospital TEXT NOT NULL,
    rating BOOLEAN NOT NULL,
    comment TEXT,
    lat FLOAT,
    lon FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

View feedback:
```sql
SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10;
```

## Component Architecture

### mapPicker.tsx
- Modal for location selection
- Leaflet map integration
- City search via Nominatim
- Pin dropping functionality

### PromptSearch.tsx
- Natural language input
- Quick suggestion buttons
- Shows current blood type and city
- Calls handlePromptSearch

### SearchForm.tsx
- Structured form with all fields
- City autocomplete dropdown
- Blood type buttongroup
- Emergency type selection
- Additional details textarea

### HospitalCard.tsx
- Displays single hospital
- Shows all metrics with icons
- AI explanation in italics
- Select Hospital button
- Triggers feedback modal

### FeedbackModal.tsx
- Yes/No rating buttons with colors
- Optional comment field
- Submit/Cancel buttons
- Success confirmation screen
- Auto-closes after submission

### App.tsx
- Main component orchestrating everything
- Manages state: location, blood type, hospitals, feedback
- Handles geolocation request on mount
- Reverse geocodes coordinates
- Makes API calls via Axios
- Renders tab-based interface
- Shows loading states and errors

## Testing the Full Flow

### Test Quick Prompt

1. Start both servers
2. Go to http://localhost:5173
3. Allow geolocation (or pick location on map)
4. Click Quick Prompt tab
5. Select suggestion: "Urgent accident needs O+ blood"
6. Click "Find Hospitals"
7. See results appear
8. Click "Select Hospital" on any result
9. Rate as helpful/not helpful
10. Add optional comment
11. See success confirmation

### Test Form Search

1. Click Form Search tab
2. Select different city from dropdown
3. Change blood type to A-
4. Select "Trauma / Injury" emergency type
5. Add comment: "Patient unconscious"
6. Click "Search Hospitals"
7. See different results based on city/blood type
8. Try feedback flow

### Test Location Picker

1. Deny geolocation when prompted
2. Map modal should appear
3. Search for "Bangalore"
4. Click on map to drop pin
5. Click "Confirm Location"
6. App should work normally with new location

## Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```

This creates `dist/` folder ready to deploy.

Deployment options:
- Netlify: `netlify deploy --prod --dir dist`
- Vercel: `vercel --prod`
- Static hosting: Copy `dist/` to web server
- Docker: Create Dockerfile and build image

### Backend Deployment

```bash
# Build Docker image for API
docker build -t thalcare-api .

# Run with environment variables
docker run -e DB_NAME=thalcare \
           -e DB_USER=postgres \
           -e DB_PASSWORD=secret \
           -e DB_HOST=db.example.com \
           -e OLLAMA_MODEL=nomic-embed-text \
           -e EXPLAIN_MODEL=mistral \
           -p 8000:8000 thalcare-api
```

## Styling & Design

- **Framework**: Tailwind CSS 4 with utility-first approach
- **Component UI**: Lucide React icons
- **Colors**: Red for emergency/critical actions, blue for secondary
- **Layout**: Responsive grid (1 col mobile, 3 cols desktop)
- **Typography**: Large, clear fonts for emergency readiness
- **Shadows**: Soft shadows on cards for depth

## Troubleshooting

### Backend Issues

**CORS errors in console**
- Ensure `CORSMiddleware` is added to FastAPI app
- Check allow_origins includes frontend URL
- Restart uvicorn server

**Database connection fails**
- Verify PostgreSQL is running
- Check .env variables (DB_NAME, DB_USER, etc.)
- Ensure user has create table permissions

**Ollama not responding**
- Verify Ollama service is running
- Check models are installed: `ollama list`
- Check URLs in main.py (localhost:11434)

### Frontend Issues

**Cannot connect to API**
- Check backend is running on http://localhost:8000
- Verify firewall allows localhost:8000
- Check .env VITE_API_URL setting
- Open browser DevTools → Network tab to see requests

**Geolocation not working**
- Check browser permissions for localhost
- Use HTTPS in production (required for geolocation)
- Try Firefox Nightly if Chrome doesn't work
- Fall back to map picker if denied

**Leaflet map blank**
- Check internet for OpenStreetMap tiles
- Clear browser cache
- Verify leaflet.css is imported
- Check browser console for JS errors

**Tailwind CSS not loading**
- Run `npm install` again
- Clear `node_modules` and reinstall
- Check tailwind.config.ts content paths
- Verify index.css has proper @tailwind directives

## Performance Tips

- Use map view sparingly (can be slow on mobile)
- Hospitals limited to 5 results to keep UI fast
- Search queries cached in browser on same city
- Async feedback submission doesn't block UI
- Lazy load components for faster initial load

## Security Considerations

- CORS allows all origins (tighten for production)
- Feedback endpoint doesn't validate hospital names
- Geolocation is client-side only
- No authentication required (add JWT for production)
- SQL injection prevented by psycopg2 parameterized queries

Consider adding:
- Rate limiting on /recommend and /feedback
- Input validation/sanitization
- API key authentication
- HTTPS enforcement
- GDPR compliance for feedback data

## Future Enhancements

1. Real-time hospital availability via APIs
2. Direct phone calling from app
3. Integration with maps (Google Maps/Directions)
4. Advanced filtering (insurance, specialization)
5. Blood bank finder
6. Saved favorite hospitals
7. Multi-language support
8. Push notifications for urgent cases
9. Admin dashboard for feedback analysis
10. Machine learning for better rankings over time

## Support & Documentation

- React: https://react.dev
- Vite: https://vite.dev
- Tailwind: https://tailwindcss.com
- FastAPI: https://fastapi.tiangolo.com
- Leaflet: https://leafletjs.com

## License

MIT - Free to use and modify

## Contact

For questions about setup or deployment, check the main project repository.
