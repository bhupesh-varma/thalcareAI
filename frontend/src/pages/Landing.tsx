import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <h1 className="text-5xl font-bold text-red-600 mb-8">ThalCare</h1>
      <div className="space-y-4 w-full max-w-sm">
        <Link to="/login" className="btn-primary w-full text-center">
          Login
        </Link>
        <Link to="/emergency" className="btn-outline w-full text-center">
          Emergency Access
        </Link>
      </div>
    </div>
  );
};

export default Landing;
