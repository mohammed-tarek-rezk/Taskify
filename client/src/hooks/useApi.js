import { useState } from 'react';
import axios from 'axios';
import { useNotification } from '../contexts/NotificationContext';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();

  const request = async (method, url, data = null, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api[method](url, data, options);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred';
      setError(errorMessage);
      addNotification(errorMessage, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const get = (url, options) => request('get', url, null, options);
  const post = (url, data, options) => request('post', url, data, options);
  const put = (url, data, options) => request('put', url, data, options);
  const del = (url, options) => request('delete', url, null, options);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
}

export default useApi; 