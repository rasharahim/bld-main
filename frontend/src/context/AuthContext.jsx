import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      try {
        // Extract user data from token
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          id: tokenPayload.id,
          full_name: tokenPayload.full_name,
          email: tokenPayload.email,
          phone_number: tokenPayload.phone_number,
          is_admin: tokenPayload.is_admin || false
        });
      } catch (error) {
        console.error('Error parsing token:', error);
        logout();
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      setToken(token);
      setUser(user);
      
      // Redirect based on user role
      if (user.is_admin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user.id);
      setToken(token);
      setUser(user);
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
        validationErrors: error.response?.data?.errors || []
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    navigate('/login');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 