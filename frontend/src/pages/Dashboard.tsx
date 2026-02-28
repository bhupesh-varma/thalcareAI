import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin,
  AlertCircle,
  Loader,
  MessageSquare,
  Map,
} from 'lucide-react';
import MapPicker from '../components/MapPicker';
import PromptSearch from '../components/PromptSearch';
import SearchForm from '../components/SearchForm';
import HospitalCard from '../components/HospitalCard';
import FeedbackModal from '../components/FeedbackModal';
import { AuthContext } from '../context/AuthContext';
import '../App.css';

interface Hospital {
  name: string;
  rating: number;
  response: number;
  icu: number;
  blood: number;
  distance: number;
  explanation: string;
}

type TabType = 'prompt' | 'form';

const API_BASE_URL = 'http://localhost:8000';

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Location state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // Blood type state (setter unused so only grab value)
  const [bloodType] = useState('blood_o_pos');

  // Search and results state
  const [activeTab, setActiveTab] = useState<TabType>('prompt');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Feedback state
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Request geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLat(position.coords.latitude);
          setUserLon(position.coords.longitude);
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Geolocation denied:', error);
          setLocationDenied(true);
          setShowMapPicker(true);
        }
      );
    } else {
      setLocationDenied(true);
      setShowMapPicker(true);
    }
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const cityName = response.data.address?.city ||
        response.data.address?.town ||
        response.data.address?.village ||
        'Current Location';
      setCity(cityName);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setCity('Current Location');
    }
  };

  const handleMapConfirm = (lat: number, lon: number, cityName: string) => {
    setUserLat(lat);
    setUserLon(lon);
    setCity(cityName);
    setShowMapPicker(false);
    setLocationDenied(false);
  };

  const handleSearch = async (
    searchCity: string,
    searchBloodType: string,
    query: string
  ) => {
    if (!userLat || !userLon) {
      setError('Location not available. Please check location access.');
      return;
    }

    setLoading(true);
    setError('');
    setHospitals([]);

    try {
      const response = await axios.post(`${API_BASE_URL}/recommend`, {
        city: searchCity,
        blood_type: searchBloodType,
        query: query,
        user_lat: userLat,
        user_lon: userLon,
      });

      setHospitals(response.data.recommendations || []);
      if (response.data.recommendations?.length === 0) {
        setError(
          'No hospitals found matching your criteria. Try adjusting your search.'
        );
      }
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : 'Failed to search hospitals. Please try again.';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptSearch = async (query: string) => {
    await handleSearch(city, bloodType, query);
  };

  const handleFormSearch = async (
    searchCity: string,
    searchBloodType: string,
    query: string
  ) => {
    await handleSearch(searchCity, searchBloodType, query);
  };

  const handleSelectHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setShowFeedback(true);
  };

  const handleSubmitFeedback = async (rating: boolean, comment: string) => {
    if (!selectedHospital || userLat === null || userLon === null) return;

    try {
      await axios.post(`${API_BASE_URL}/feedback`, {
        hospital: selectedHospital.name,
        rating: rating,
        comment: comment || '',
        user_lat: userLat,
        user_lon: userLon,
      });
    } catch (err) {
      console.error('Feedback submission error:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userLat || !userLon || showMapPicker) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Emergency Aid Finder
            </h1>
            <p className="text-gray-600 text-lg">
              {locationDenied
                ? 'Please share your location to find nearby hospitals.'
                : 'Requesting your location...'}
            </p>
            <Loader className="w-8 h-8 text-red-500 mx-auto animate-spin" />
          </div>
        </div>
        {showMapPicker && (
          <MapPicker
            onConfirm={handleMapConfirm}
            onCancel={() => {
              setShowMapPicker(false);
              setLocationDenied(true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Emergency Hospital Finder
                </h1>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {city}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMapPicker(true)}
                className="btn-outline text-sm"
              >
                Change Location
              </button>
              <button
                onClick={handleLogout}
                className="btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Tabs */}
              <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg shadow-md">
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`flex-1 py-2 px-3 rounded-md font-semibold transition-colors ${
                    activeTab === 'prompt'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Quick Prompt
                </button>
                <button
                  onClick={() => setActiveTab('form')}
                  className={`flex-1 py-2 px-3 rounded-md font-semibold transition-colors ${
                    activeTab === 'form'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Form Search
                </button>
              </div>

              {/* Search Forms */}
              {activeTab === 'prompt' ? (
                <PromptSearch
                  city={city}
                  bloodType={bloodType}
                  userLat={userLat}
                  userLon={userLon}
                  onSearch={handlePromptSearch}
                  loading={loading}
                />
              ) : (
                <SearchForm
                  initialCity={city}
                  initialBloodType={bloodType}
                  userLat={userLat}
                  userLon={userLon}
                  onSearch={handleFormSearch}
                  loading={loading}
                />
              )}

              {/* Blood Type Info */}
              <div className="mt-6 card-lg">
                <p className="text-xs text-gray-600 mb-2">Current Blood Type</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">
                    {bloodType.replace('blood_', '').toUpperCase()}
                  </span>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Change →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {error && (
              <div className="card-lg bg-red-50 border-l-4 border-red-500 mb-6">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {hospitals.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="section-title">
                    Recommended Hospitals ({hospitals.length})
                  </h2>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="btn-outline text-sm flex items-center gap-2"
                  >
                    <Map className="w-4 h-4" />
                    {showMap ? 'List' : 'Map'}
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-gray-600 font-semibold">
                  Searching for the best hospitals...
                </p>
              </div>
            ) : hospitals.length > 0 ? (
              <div className="space-y-4">
                {hospitals.map((hospital, index) => (
                  <HospitalCard
                    key={`${hospital.name}-${index}`}
                    hospital={hospital}
                    onSelect={handleSelectHospital}
                  />
                ))}
              </div>
            ) : (
              <div className="card-lg text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-semibold">
                  {activeTab === 'prompt'
                    ? 'Describe your emergency to find hospitals'
                    : 'Fill the form and search to get recommendations'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <MapPicker
          onConfirm={handleMapConfirm}
          onCancel={() => setShowMapPicker(false)}
        />
      )}

      {/* Feedback Modal */}
      {showFeedback && selectedHospital && (
        <FeedbackModal
          hospital={selectedHospital.name}
          userLat={userLat}
          userLon={userLon}
          onClose={() => {
            setShowFeedback(false);
            setSelectedHospital(null);
          }}
          onSubmit={handleSubmitFeedback}
        />
      )}
    </div>
  );
};

export default Dashboard;
