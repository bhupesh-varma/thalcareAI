import { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

interface PromptSearchProps {
  city: string;
  bloodType: string;
  userLat: number;
  userLon: number;
  onSearch: (query: string) => Promise<void>;
  loading: boolean;
}

const PromptSearch = ({
  city,
  bloodType,
  userLat,
  userLon,
  onSearch,
  loading,
}: PromptSearchProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await onSearch(query);
      setQuery('');
    }
  };

  const suggestions = [
    'Urgent accident needs O+ blood',
    'Critical condition requires ICU and blood',
    'Emergency surgery patient needs nearby hospital',
    'Trauma case with heavy bleeding',
  ];

  return (
    <div className="space-y-4">
      <div className="card-lg bg-yellow-50 border-l-4 border-yellow-500">
        <div className="flex gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-900">Quick Emergency Response</p>
            <p className="text-sm text-yellow-800 mt-1">
              Describe your emergency in natural language. We'll find the best hospital for you.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe your emergency:
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., 'Urgent accident with heavy bleeding, need O+ blood and ICU'"
            className="input-field resize-none h-28"
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Blood Type</p>
            <p className="font-bold text-gray-900">{bloodType.replace('blood_', '').toUpperCase()}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">City</p>
            <p className="font-bold text-gray-900">{city || 'Detecting...'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Quick suggestions:</p>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setQuery(suggestion)}
                className="text-left p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700"
              >
                → {suggestion}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          {loading ? 'Finding Hospitals...' : 'Find Hospitals'}
        </button>
      </form>
    </div>
  );
};

export default PromptSearch;
