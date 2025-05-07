// src/services/api.ts
import axios from 'axios';

// Para emulador Android
const api = axios.create({
  baseURL: 'http://10.0.2.2:5000'
});

// Para dispositivo físico, use o IP da sua máquina na rede
// const api = axios.create({
//   baseURL: 'http://SEU_IP_AQUI:5000'
// });

export default api;