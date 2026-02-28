import { useState } from 'react';

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
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) {
      alert('Please enter a city');
      return;
    }
    await onSearch(city, bloodType, query);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          City *
        </label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="input-field"
          placeholder="Enter city"
          disabled={loading}
          autoComplete="off"
          required
        />
      </div>

      {/* Blood Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Blood Type *
        </label>
        <select
          value={bloodType}
          onChange={(e) => setBloodType(e.target.value)}
          className="input-field"
          disabled={loading}
        >
          {BLOOD_TYPES.map((bt) => (
            <option key={bt.value} value={bt.value}>
              {bt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Query (optional) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Query (optional)
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input-field"
          placeholder="Any extra keywords or notes"
          disabled={loading}
        />
      </div>

      {/* Location Info */}
      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="text"
            value={userLat || ''}
            readOnly
            className="input-field bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="text"
            value={userLon || ''}
            readOnly
            className="input-field bg-gray-100"
          />
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
      >
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
};

export default SearchForm;
