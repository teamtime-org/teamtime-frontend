import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '@/services/authService';
import { STORAGE_KEYS } from '@/constants';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  userId: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        userId: action.payload.userId,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        userId: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        userId: null,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        
        if (token && userData) {
          const user = JSON.parse(userData);
          // Decode JWT to get userId
          try {
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user, userId: tokenPayload.userId } });
          } catch (error) {
            console.error('Error decoding JWT token:', error);
            // Fallback to user.id if JWT decoding fails
            dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user, userId: user.id } });
          }
          
          // Note: Skip token verification for now since /auth/me endpoint is not implemented
          // In production, you would verify the token here
          // try {
          //   const response = await authService.getMe();
          //   dispatch({ type: 'UPDATE_USER', payload: response.data.user });
          // } catch (error) {
          //   console.error('Token verification failed:', error);
          //   localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          //   localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          //   dispatch({ type: 'LOGOUT' });
          // }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authService.login(credentials);
      
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      
      // Decode JWT to get userId
      try {
        const tokenPayload = JSON.parse(atob(response.data.token.split('.')[1]));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { ...response.data, userId: tokenPayload.userId } });
      } catch (error) {
        console.error('Error decoding JWT token during login:', error);
        // Fallback to user.id if JWT decoding fails
        dispatch({ type: 'LOGIN_SUCCESS', payload: { ...response.data, userId: response.data.user.id } });
      }
      return response;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
      ...state.user,
      ...userData
    }));
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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

export default AuthContext;