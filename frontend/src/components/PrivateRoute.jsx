import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading component
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the route requires admin access
  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute; 