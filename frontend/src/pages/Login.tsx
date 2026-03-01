import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:8000';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });
      const token = response.data.access_token;
      if (token) {
        login(token);
        navigate('/dashboard');
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? err.response.data.detail
          : 'Login failed. Please check your credentials.';
      setError(msg);
    }
  };

  const handleEmergency = () => {
    localStorage.setItem('emergency', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-500 text-white py-2 px-4 rounded"
          >
            Login
          </button>
        </form>
        <button
          onClick={handleEmergency}
          className="mt-4 w-full border border-gray-300 py-2 px-4 rounded text-center"
        >
          Emergency Access
        </button>
        <p className='mt-4 text-center text-s, text-gray-600'>
          Dont have an account? {" "}
          <span
          onClick={() => navigate('/register')}
          className="text-red-600 hover:underline cursor-pointer"
          >
            Create One
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
