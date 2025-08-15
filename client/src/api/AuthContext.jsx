import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from './apiClient';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const { data } = await apiClient.getCurrentUser();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
        apiClient.setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  const signUp = async (email, password, userData = {}) => {
    try {
      const { data } = await apiClient.signup({
        email,
        password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role || 'user',
      });

      // Set auth token and user
      apiClient.setAuthToken(data.token);
      setUser(data.user);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password, role) => {
    try {
      const { data } = await apiClient.login({
        email,
        password,
        role, // Pass the role parameter
      });

      // Set auth token and user
      apiClient.setAuthToken(data.token);
      setUser(data.user);

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Clear auth token and user
      apiClient.setAuthToken(null);
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};