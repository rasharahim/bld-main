// Auth utility functions
const TOKEN_KEY = 'token';
const USER_ID_KEY = 'userId';

const auth = {
  // Get token from localStorage
  getToken: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('No authentication token found');
      }
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  },

  // Store token in localStorage
  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  },

  // Remove token and user ID (logout)
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_ID_KEY);
    } catch (error) {
      console.error('Error removing auth data:', error);
      throw error;
    }
  },

  // Get user ID from localStorage
  getUserId: () => {
    try {
      const userId = localStorage.getItem(USER_ID_KEY);
      if (!userId) {
        throw new Error('No user ID found');
      }
      return parseInt(userId);
    } catch (error) {
      console.error('Error getting user ID:', error);
      throw error;
    }
  },

  // Store user ID in localStorage
  setUserId: (userId) => {
    try {
      localStorage.setItem(USER_ID_KEY, userId);
    } catch (error) {
      console.error('Error storing user ID:', error);
      throw error;
    }
  },

  // Verify token exists and is valid (basic check)
  isAuthenticated: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userId = localStorage.getItem(USER_ID_KEY);
      if (!token || !userId) return false;
      
      // Optional: Add JWT verification logic here if needed
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  },

  // Get token payload (if using JWT)
  getTokenPayload: () => {
    try {
      const token = auth.getToken();
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
};

export default auth;