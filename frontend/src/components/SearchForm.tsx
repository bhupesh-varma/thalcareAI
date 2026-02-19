import { useState } from 'react';
import { Filter, Send } from 'lucide-react';

interface SearchFormProps {
  initialCity: string;
  initialBloodType: string;
  userLat: number;
  userLon: number;
  onSearch: (city: string, bloodType: string, query: string) => Promise<void>;
  loading: boolean;
}

const BLOOD_TYPES = [
  { value: 'blood_o_pos', label: 'O+' },
  { value: 'blood_o_neg', label: 'O-' },
  { value: 'blood_a_pos', label: 'A+' },
  { value: 'blood_a_neg', label: 'A-' },
  { value: 'blood_b_pos', label: 'B+' },
  { value: 'blood_b_neg', label: 'B-' },
  { value: 'blood_ab_pos', label: 'AB+' },
  { value: 'blood_ab_neg', label: 'AB-' },
];

const INDIAN_CITIES = [
  'Delhi',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Indore',
  'Kochi',
  'Gurugram',
  'Noida',
];

const EMERGENCY_TYPES = [
  { value: 'accident', label: '🚗 Traffic Accident' },
  { value: 'trauma', label: '⚡ Trauma / Injury' },
  { value: 'surgery', label: '🏥 Emergency Surgery' },
  { value: 'bleeding', label: '🩸 Severe Bleeding' },
  { value: 'other', label: '⚠️ Other Emergency' },
];

interface SearchFormProps {
  initialCity: string;
  initialBloodType: string;
  userLat: number;
  userLon: number;
  onSearch: (city: string, bloodType: string, query: string) => Promise<void>;
  loading: boolean;
}

const SearchForm = ({
  initialCity,
  initialBloodType,
  userLat,
  userLon,
  onSearch,
  loading,
}: SearchFormProps) => {
  const [city, setCity] = useState(initialCity);
  const [bloodType, setBloodType] = useState(initialBloodType);
  const [emergencyType, setEmergencyType] = useState('accident');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!city.trim()) {
      alert('Please select a city');
      return;
    }

    const query = `Emergency: ${emergencyType} - Patient blood type: ${bloodType}${
      additionalInfo ? ` - Additional info: ${additionalInfo}` : ''
    }`;

    await onSearch(city, bloodType, query);
  };

  return (
    <div className="space-y-4">
      <div className="card-lg bg-blue-50 border-l-4 border-blue-500">
        <div className="flex gap-3">
          <Filter className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Structured Hospital Search</p>
            <p className="text-sm text-blue-800 mt-1">
              Fill in your details for precise hospital recommendations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* City Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            City *
          </label>
          <div className="relative">
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setIsCityDropdownOpen(true);
              }}
              onFocus={() => setIsCityDropdownOpen(true)}
              className="input-field"
              placeholder="Search or enter city name"
              disabled={loading}
              autoComplete="off"
            />
            {isCityDropdownOpen && city && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 z-10 shadow-lg max-h-48 overflow-y-auto">
                {INDIAN_CITIES.filter((c) =>
                  c.toLowerCase().includes(city.toLowerCase())
                ).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setIsCityDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blood Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Blood Type *
          </label>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt.value}
                type="button"
                onClick={() => setBloodType(bt.value)}
                className={`py-2 px-2 rounded-lg font-semibold transition-colors text-sm ${
                  bloodType === bt.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
                disabled={loading}
              >
                {bt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type of Emergency
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EMERGENCY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setEmergencyType(type.value)}
                className={`py-3 px-3 rounded-lg transition-colors text-sm font-medium ${
                  emergencyType === type.value
                    ? 'bg-red-100 border-2 border-red-500 text-red-700'
                    : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:border-red-300'
                }`}
                disabled={loading}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional details (optional)
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Any other relevant information about the emergency..."
            className="input-field resize-none h-20"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!city.trim() || loading}
          className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          {loading ? 'Searching Hospitals...' : 'Search Hospitals'}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
