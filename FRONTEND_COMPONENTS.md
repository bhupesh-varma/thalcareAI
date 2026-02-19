# Frontend Components Documentation

## Overview

The frontend is built with React 19 + TypeScript using Vite as the build tool. All styling is handled by Tailwind CSS 4 with a mobile-first responsive design approach.

## Component Architecture

```
App.tsx (Main Component)
├── Header Section
│   ├── App Title + Logo
│   ├── Location Display
│   └── Change Location Button
├── Main Content Grid (1 col mobile, 3 cols desktop)
│   ├── Left Column (Sidebar)
│   │   ├── Tab Switcher (Quick Prompt / Form Search)
│   │   ├── PromptSearch.tsx OR SearchForm.tsx
│   │   └── Blood Type Display Card
│   └── Right Column (Results)
│       ├── Error Messages (conditional)
│       ├── Hotels Loading State (conditional)
│       ├── Hospital Results (HospitalCard.tsx × n)
│       └── Empty State (conditional)
├── MapPicker.tsx (Modal - used for location selection when geolocation denied)
└── FeedbackModal.tsx (Modal - appears after hospital selection)
```

## Component Details

### 1. App.tsx (Main Application Component)

**Purpose**: Orchestrates the entire application, manages state, and handles API communication.

**State Variables**:
```typescript
// Location
userLat: number | null           // User's latitude
userLon: number | null           // User's longitude
city: string                      // Detected city name
showMapPicker: boolean            // Toggle map modal
locationDenied: boolean           // Track if geolocation denied

// Search
bloodType: string                 // Current blood type (blood_o_pos, etc.)
activeTab: 'prompt' | 'form'      // Current search tab
hospitals: Hospital[]             // Search results
loading: boolean                  // API loading state
error: string                     // Error message
showMap: boolean                  // Toggle map view in results

// Feedback
selectedHospital: Hospital | null // Hospital for feedback
showFeedback: boolean             // Toggle feedback modal
```

**Key Functions**:
- `useEffect()` - Requests geolocation on mount
- `reverseGeocode()` - Converts lat/lon to city name
- `handleSearch()` - Calls API with search parameters
- `handleSubmitFeedback()` - Posts feedback to backend
- `handleSelectHospital()` - Opens feedback modal for hospital

**Layout**:
- Header with sticky positioning (fixed when scrolling)
- 3-column grid layout on desktop, single column on mobile
- Left sidebar with search forms (sticky on desktop)
- Right area for results
- Two modals: MapPicker and FeedbackModal

**Styling**:
- Gradient background: red → white → blue
- Card-based layout with shadows
- Emergency color scheme (red for critical actions)
- Large, accessible buttons and text

---

### 2. MapPicker.tsx

**Purpose**: Allows users to manually select their location when geolocation is denied.

**Props**:
```typescript
interface MapPickerProps {
  onConfirm: (lat: number, lon: number, city: string) => void
  onCancel: () => void
}
```

**Features**:
- Leaflet map with OpenStreetMap tiles
- City search via Nominatim reverse geocoding
- Click on map to drop location pin
- Search field to find cities in India
- Confirm/Cancel buttons

**API Integration**:
- Uses OpenStreetMap Nominatim for:
  - City search: `https://nominatim.openstreetmap.org/search`
  - Reverse geocoding: Not needed for this component

**Styling**:
- Modal with centered overlay
- Map container with fixed height (300px)
- Search input with button in header
- Dark overlay (40% opacity) behind modal
- Z-index: 50 (above all other content)

**State**:
```typescript
mapRef: useRef<L.Map>              // Leaflet map instance
containerRef: useRef<HTMLDiv>      // Map DOM container
markerRef: useRef<L.Marker>        // Current location marker
selectedCity: string               // User-selected city name
searchInput: string                // Search field value
```

---

### 3. PromptSearch.tsx

**Purpose**: Natural language emergency search interface.

**Props**:
```typescript
interface PromptSearchProps {
  city: string                     // Current city
  bloodType: string                // Current blood type
  userLat: number                  // User latitude
  userLon: number                  // User longitude
  onSearch: (query: string) => Promise<void>  // Search callback
  loading: boolean                 // Loading state
}
```

**Features**:
- Large textarea for emergency description (28rem height)
- Quick suggestion buttons (4 pre-written examples)
- Display current city and blood type
- Emergency-friendly yellow alert box at top
- Search button with icon

**Quick Suggestions**:
1. "Urgent accident needs O+ blood"
2. "Critical condition requires ICU and blood"
3. "Emergency surgery patient needs nearby hospital"
4. "Trauma case with heavy bleeding"

**Styling**:
- Yellow alert box (bg-yellow-50, border-yellow-500)
- Large text for readability
- Quick suggestion buttons are half-width stacked
- Disabled state while loading

**Form Actions**:
- Clicking suggestion fills textarea
- Enter key submits form
- Submit button shows "Finding Hospitals..." while loading

---

### 4. SearchForm.tsx

**Purpose**: Structured form-based hospital search with dropdowns.

**Props**:
```typescript
interface SearchFormProps {
  initialCity: string              // Pre-filled city
  initialBloodType: string         // Pre-filled blood type
  userLat: number
  userLon: number
  onSearch: (city, bloodType, query) => Promise<void>
  loading: boolean
}
```

**Form Fields**:

1. **City Selection**
   - Autocomplete dropdown
   - 15 major Indian cities
   - Real-time filtering as user types
   - Dropdown closes on selection
   - Optional custom city entry

2. **Blood Type Selection**
   - 8 button group (O+, O-, A+, A-, B+, B-, AB+, AB-)
   - Selected state shows red background
   - 4 columns layout

3. **Emergency Type Selection**
   - 5 options with emojis:
     - 🚗 Traffic Accident
     - ⚡ Trauma / Injury
     - 🏥 Emergency Surgery
     - 🩸 Severe Bleeding
     - ⚠️ Other Emergency
   - 2 columns layout
   - Selected shows red border and light background

4. **Additional Details**
   - Optional textarea
   - Max recommended 500 characters
   - Placeholder text guides input

**Cities List**:
Delhi, Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Indore, Kochi, Gurugram, Noida

**Styling**:
- Blue info box at top (bg-blue-50, border-blue-500)
- Grid layouts for buttons (responsive)
- Dropdown has max-height with scrolling
- Smooth transitions on button states

**Form Validation**:
- City is required
- Blood type must be selected
- Alerts user if city is missing on submit

---

### 5. HospitalCard.tsx

**Purpose**: Display individual hospital recommendations with all details.

**Props**:
```typescript
interface HospitalCardProps {
  hospital: Hospital              // Hospital data
  onSelect: (hospital) => void    // Selection callback (opens feedback)
}
```

**Hospital Data**:
```typescript
interface Hospital {
  name: string                     // Hospital name
  rating: number                   // 0-5 star rating
  response: number                 // Response time in minutes
  icu: number                      // ICU beds available
  blood: number                    // Blood units available
  distance: number                 // Distance in km
  explanation: string              // AI explanation from Ollama
}
```

**Card Layout**:
```
┌─────────────────────────────────┐
│ Hospital Name    ⭐ 4.2 • 📍 2.1km │
│                                  │
│ ⏱️ 19 min  ❤️ 8 beds  🩸 6 units  │
│                                  │
│ "This hospital is recommended..." │
│                                  │
│ [        Select Hospital         ] │
└─────────────────────────────────┘
```

**Icons**:
- ⭐ Star for rating
- 📍 Map pin for distance
- ⏱️ Clock for response time
- ❤️ Heart for ICU beds
- 🩸 Blood droplet for blood units

**Styling**:
- Card with shadow (hover increases shadow)
- Top section: Name + rating + distance
- Middle section: 3-column metric display (border-y)
- Bottom: Italic explanation text
- Large red button for selection

**Animation**:
- Fade-in animation on card appearance (300ms)
- Hover state increases shadow slightly

---

### 6. FeedbackModal.tsx

**Purpose**: Collect user feedback about hospital recommendations after selection.

**Props**:
```typescript
interface FeedbackModalProps {
  hospital: string                 // Hospital name (for confirmation)
  userLat: number                  // User location
  userLon: number                  // User location
  onClose: () => void              // Modal close callback
  onSubmit: (rating, comment) => Promise<void>  // Submit callback
}
```

**State**:
```typescript
rating: boolean | null             // true = helpful, false = not helpful
comment: string                    // Optional feedback text
loading: boolean                   // Submission loading state
submitted: boolean                 // Shows success screen
```

**Modal States**:

1. **Input State**
   - Hospital name displayed for confirmation
   - Two rating buttons: Yes (green) / No (red)
   - Optional comment textarea
   - Submit and Cancel buttons

2. **Success State**
   - Green checkmark icon
   - "Thank You!" heading
   - Confirmation message
   - Auto-closes after 2 seconds

**Button States**:
- Yes Button:
  - Unselected: gray border
  - Selected: green border + bg-green-50
  - Show thumbs-up icon

- No Button:
  - Unselected: gray border
  - Selected: red border + bg-red-50
  - Show thumbs-down icon

**Validation**:
- Requires rating selection (Yes or No)
- Shows alert if trying to submit without rating
- Comment is optional

**Styling**:
- Modal overlay (50% black opacity)
- Centered white card
- Z-index: 50 (same as MapPicker)
- Smooth transitions between states

---

## Type Definitions

```typescript
// Main hospital data structure
interface Hospital {
  name: string
  rating: number
  response: number      // minutes
  icu: number          // beds
  blood: number        // units
  distance: number     // km
  explanation: string
}

// Tab type
type TabType = 'prompt' | 'form'

// Search requests (matching backend schemas)
interface SearchRequest {
  city: string
  blood_type: string   // blood_o_pos format
  query: string
  user_lat: number
  user_lon: number
}

interface FeedbackRequest {
  hospital: string
  rating: boolean
  comment: string
  user_lat: number
  user_lon: number
}
```

---

## Styling System

### Tailwind Configuration

**Custom Colors**:
- `emergency`: Red (#EF4444) for critical actions
- `safe`: Green (#10B981) for success states

**Custom Components** (defined in index.css):
```css
.btn-primary         /* Red emergency button */
.btn-secondary       /* Gray secondary button */
.btn-outline         /* Outlined button */
.card                /* Basic card with shadow */
.card-lg             /* Large card with more padding */
.input-field         /* Form input with focus states */
.section-title       /* Large section heading */
.section-subtitle    /* Subtitle text */
```

### Responsive Breakpoints

- **Mobile**: Default (< 640px)
- **Tablet**: `sm` (640px+)
- **Desktop**: `lg` (1024px+)

Main layout switches from 1 column to 3 columns at `lg` breakpoint.

---

## State Management Pattern

The app uses React hooks for state management:

```typescript
// Location State
const [userLat, setUserLat] = useState<number | null>(null)
const [userLon, setUserLon] = useState<number | null>(null)
const [city, setCity] = useState('')

// Search State
const [bloodType, setBloodType] = useState('blood_o_pos')
const [activeTab, setActiveTab] = useState<TabType>('prompt')
const [hospitals, setHospitals] = useState<Hospital[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')

// Modal State
const [showMapPicker, setShowMapPicker] = useState(false)
const [showFeedback, setShowFeedback] = useState(false)
const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null)
```

Each state change triggers re-renders of affected components for real-time updates.

---

## API Integration

### Axios Configuration

```typescript
// Default config (set in App.tsx)
axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.headers.post['Content-Type'] = 'application/json'
```

### API Calls

**Search Recommend**:
```typescript
const response = await axios.post(`${API_BASE_URL}/recommend`, {
  city, blood_type, query, user_lat, user_lon
})
```

**Submit Feedback**:
```typescript
await axios.post(`${API_BASE_URL}/feedback`, {
  hospital, rating, comment, user_lat, user_lon
})
```

### Error Handling

```typescript
try {
  // API call
} catch (err) {
  if (axios.isAxiosError(err)) {
    // Handle axios-specific errors
    const message = err.response?.data?.detail || 'Unknown error'
  }
  // Set error state
  setError(message)
}
```

---

## Browser APIs Used

### Geolocation API
```typescript
navigator.geolocation.getCurrentPosition(
  (position) => {
    setUserLat(position.coords.latitude)
    setUserLon(position.coords.longitude)
  },
  (error) => {
    // Handle denial
  }
)
```

### Leaflet Maps
```typescript
import L from 'leaflet'
const map = L.map(containerRef.current).setView([lat, lon], 5)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
```

---

## Performance Considerations

1. **Memoization**: Consider useMemo for expensive computations
2. **Lazy Loading**: Components load only when needed
3. **Debouncing**: Form inputs could debounce for real-time search
4. **Image Optimization**: Vite handles automatically
5. **Bundle Size**: Tree-shaking removes unused code

---

## Accessibility Features

1. **Semantic HTML**: `<button>`, `<form>`, `<header>`
2. **ARIA Labels**: Added where needed for screen readers
3. **Color Contrast**: WCAG AA compliance for text colors
4. **Keyboard Navigation**: Tab through buttons and form fields
5. **Focus States**: Visible focus rings on interactive elements

---

## Future Enhancements

1. **Service Worker**: Offline capability
2. **Progressive Image Loading**: Lazy load hospital images
3. **Real-time Updates**: WebSocket for live hospital availability
4. **State Persistence**: localStorage for user preferences
5. **Dark Mode**: Toggle dark theme
6. **Internationalization**: Multi-language support
7. **Analytics**: Track search patterns and feedback

---

## Debugging Tips

1. Install React DevTools browser extension
2. Check browser console for errors
3. Use Network tab in DevTools to inspect API calls
4. Use React DevTools Profiler to check performance
5. Check localStorage and sessionStorage for cached data

---

## Component Testing

Each component can be tested independently:

```typescript
// Example test structure
describe('HospitalCard', () => {
  it('renders hospital name', () => {
    const hospital = { /* sample data */ }
    render(<HospitalCard hospital={hospital} onSelect={jest.fn()} />)
    expect(screen.getByText('Hospital Name')).toBeInTheDocument()
  })
})
```

---

## File Organization Best Practices

```
src/
├── components/
│   ├── MapPicker.tsx         # Single file per component
│   ├── PromptSearch.tsx
│   ├── SearchForm.tsx
│   ├── HospitalCard.tsx
│   └── FeedbackModal.tsx
├── App.tsx                    # Main app component
├── main.tsx                   # React entry
├── index.css                  # Global styles
└── App.css                    # App-specific styles
```

Keep components focused on single responsibility for easier testing and maintenance.

---

## Reference Links

- React: https://react.dev/reference
- Tailwind CSS: https://tailwindcss.com/docs
- Vite: https://vitejs.dev/guide/
- Leaflet: https://leafletjs.com/reference
- Axios: https://axios-http.com/docs/intro
