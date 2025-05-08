// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use a URL do seu servidor no Render
const api = axios.create({
  baseURL: 'https://finance-api-yhku.onrender.com',
  timeout: 10000, // Timeout maior para lidar com o "cold start" do Render
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@finance_app:token');
      
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      
      return config;
    } catch (error) {
      console.error('Erro ao adicionar token:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;