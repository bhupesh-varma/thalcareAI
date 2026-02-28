import { useState } from 'react';
import api from '../services/api';

const Emergency = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleEmergency = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const resp = await api.get('/emergency');
      setMessage(resp.data.message || 'Emergency access enabled');
    } catch (err: any) {
      console.error(err);
      setError('Could not reach emergency service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Emergency Access
        </h1>
        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleEmergency}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? 'Contacting…' : 'Enable Emergency'}
        </button>
      </div>
    </div>
  );
};

export default Emergency;
