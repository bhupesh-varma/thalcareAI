import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';

interface MapPickerProps {
  onConfirm: (lat: number, lon: number, city: string) => void;
  onCancel: () => void;
}

const MapPicker = ({ onConfirm, onCancel }: MapPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!containerRef.current) return;

    // Fix Leaflet default icon
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // Initialize map centered on India
    const map = L.map(containerRef.current).setView([20.5937, 78.9629], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([lat, lng]).addTo(map);
    });

    return () => {
      map.remove();
    };
  }, []);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(searchInput)}&country=india&format=json`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 13);

          if (markerRef.current) {
            mapRef.current.removeLayer(markerRef.current);
          }
          markerRef.current = L.marker([lat, lon]).addTo(mapRef.current);
          setSelectedCity(searchInput);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleConfirm = () => {
    if (!markerRef.current) {
      alert('Please select a location on the map');
      return;
    }

    const { lat, lng } = markerRef.current.getLatLng();
    const city = selectedCity || 'Current Location';
    onConfirm(lat, lng, city);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-96 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold">Select Your Location</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search city name..."
            className="input-field flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="btn-primary">
            Search
          </button>
        </div>

        <div ref={containerRef} className="flex-1 w-full" style={{ minHeight: '300px' }} />

        <div className="p-4 border-t flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleConfirm} className="btn-primary">
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
