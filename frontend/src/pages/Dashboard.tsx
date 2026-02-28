import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import HospitalCard from '../components/HospitalCard';
import SearchForm from '../components/SearchForm';

interface Hospital {
  name: string;
  rating: number;
  response: number;
  icu: number;
  blood: number;
  distance: number;
}

const Dashboard = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.token) {
      navigate('/login');
      return;
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
          // optionally reverse geocode to fill city
          // keep simple: leave city blank, user can type
        },
        () => {
          console.warn('location denied');
        }
      );
    }
  }, [auth.token, navigate]);

  const handleSearch = async (searchCity: string, searchBlood: string, searchQuery: string) => {
    if (userLat === null || userLon === null) {
      setError('Location not available.');
      return;
    }
    setLoading(true);
    setError('');
    setHospitals([]);
    try {
      const resp = await api.post('/recommend', {
        city: searchCity,
        blood_type: searchBlood,
        query: searchQuery,
        user_lat: userLat,
        user_lon: userLon,
      });
      const list: Hospital[] = resp.data.recommendations || [];
      setHospitals(list);
      if (list.length === 0) {
        setError('No hospitals found. Try another search.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch hospitals.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="section-title">Dashboard</h1>
        <p className="text-gray-700 mb-4">Welcome to ThalCare.</p>
        <SearchForm
          initialCity=""
          initialBloodType="blood_o_pos"
          userLat={userLat || 0}
          userLon={userLon || 0}
          onSearch={handleSearch}
          loading={loading}
        />
        {loading && <Loader />}
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {!loading && hospitals.length > 0 && (
          <div className="mt-6 space-y-4">
            {hospitals.map((h, idx) => (
              <HospitalCard key={idx} hospital={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
