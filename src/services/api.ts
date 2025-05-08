// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure para usar o servidor no Render
const api = axios.create({
  baseURL: 'https://finance-api-yhku.onrender.com',
  timeout: 60000, // Aumentado para 60 segundos para lidar com cold starts do Render
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        config.headers['x-auth-token'] = token;
      }
      
      console.log('Fazendo requisição para:', config.url);
      return config;
    } catch (error) {
      console.error('Erro ao adicionar token:', error);
      return config;
    }
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

// Interceptor para melhor tratamento de erros
api.interceptors.response.use(
  response => {
    console.log('Resposta recebida de:', response.config.url);
    return response;
  },
  error => {
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Erro de resposta:', error.response.status, error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Erro de requisição (sem resposta):', error.request);
    } else {
      // Ocorreu um erro ao configurar a requisição
      console.error('Erro:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;