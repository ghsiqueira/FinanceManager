// src/services/api.ts
import axios from 'axios';

// Para emulador Android
const api = axios.create({
  baseURL: 'https://finance-api.onrender.com',
});

// Para dispositivo físico, use o IP da sua máquina na rede
// const api = axios.create({
//   baseURL: 'http://SEU_IP_AQUI:5000'
// });

export default api;