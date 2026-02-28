import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated) {
    return children;
  }

  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
