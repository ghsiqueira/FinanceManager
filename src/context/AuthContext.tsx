// src/context/AuthContext.tsx
import React, { createContext, useReducer, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User } from '../types';
import api from '../services/api';
import { Alert } from 'react-native';

// Estado inicial
const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Tipos de ações
type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'REGISTER_SUCCESS'; payload: { token: string; user: User } }
  | { type: 'AUTH_ERROR' }
  | { type: 'LOGIN_FAIL'; payload: string }
  | { type: 'REGISTER_FAIL'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'USER_LOADED'; payload: User }
  | { type: 'LOADING_END' }
  | { type: 'UPDATE_USER'; payload: User }; // Adicionado o tipo UPDATE_USER

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      AsyncStorage.setItem('token', action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
      AsyncStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.type === 'AUTH_ERROR' ? 'Erro de autenticação' : action.payload
      };
    case 'LOGOUT':
      AsyncStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
    case 'LOADING_END':
      return {
        ...state,
        isLoading: false
      };
    default:
      return state;
  }
};

interface AuthContextProps {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearErrors: () => void; // Adicionado clearErrors na interface
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Carregar token salvo
  useEffect(() => {
    const loadToken = async () => {
      try {
        setIsLoading(true);
        const token = await AsyncStorage.getItem('token');
        
        if (token) {
          console.log('Token encontrado, tentando autenticar...');
          api.defaults.headers.common['x-auth-token'] = token;
          
          try {
            console.log('Fazendo requisição para verificar usuário...');
            const res = await api.get('/api/user');
            console.log('Usuário carregado com sucesso:', res.data);
            dispatch({ type: 'USER_LOADED', payload: res.data });
          } catch (err: any) {
            console.error('Erro ao carregar usuário:', err);
            
            // Verificar se é um erro de timeout
            if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
              console.log('Timeout ao conectar com o servidor. Tentando usar o token local...');
              
              // Em caso de timeout, tente usar o token existente para autenticar o usuário
              try {
                // Parse do token para extrair dados do usuário
                // Nota: isso é apenas para melhorar a UX, ainda será necessária a validação no servidor depois
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  if (payload && payload.userId) {
                    // Se o token não expirou, permita o login temporário
                    const expiry = payload.exp * 1000; // Converter para milissegundos
                    if (expiry > Date.now()) {
                      console.log('Usando informações do token para login temporário');
                      // Criar um objeto de usuário mínimo a partir do token
                      const tempUser = {
                        id: payload.userId,
                        email: payload.email || 'usuário',
                        name: payload.name || 'Usuário'
                      };
                      dispatch({ type: 'USER_LOADED', payload: tempUser });
                      return;
                    }
                  }
                }
              } catch (decodeErr) {
                console.error('Erro ao decodificar token:', decodeErr);
              }
            }
            
            dispatch({ type: 'AUTH_ERROR' });
          }
        } else {
          console.log('Nenhum token encontrado');
          dispatch({ type: 'LOADING_END' });
        }
      } catch (err) {
        console.error('Erro geral ao carregar token:', err);
        dispatch({ type: 'LOADING_END' });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadToken();
  }, []);

  // Função utilitária para decodificar base64 (pode ser colocada fora do componente)
  function atob(str: string): string {
    return Buffer.from(str, 'base64').toString('binary');
  }

  // Login
  const login = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login:', { email });
      console.log('API baseURL:', api.defaults.baseURL);
      
      const res = await api.post('/api/login', { email, password });
      console.log('Resposta do login:', res.data);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      
      api.defaults.headers.common['x-auth-token'] = res.data.token;
    } catch (err: any) {
      console.error('Erro completo do login:', err);
      
      if (err.response) {
        console.error('Dados do erro:', err.response.data);
        console.error('Status do erro:', err.response.status);
      } else if (err.request) {
        console.error('Erro de requisição (sem resposta):', err.request);
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.');
      } else {
        console.error('Mensagem de erro:', err.message);
      }
      
      dispatch({
        type: 'LOGIN_FAIL',
        payload: err.response?.data?.message || 'Erro ao fazer login'
      });
    }
  };

  // Registro
  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('Tentando registrar usuário:', { name, email });
      console.log('API baseURL:', api.defaults.baseURL);
      
      const res = await api.post('/api/register', { name, email, password });
      console.log('Resposta do registro:', res.data);
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data
      });
      
      api.defaults.headers.common['x-auth-token'] = res.data.token;
    } catch (err: any) {
      console.error('Erro completo do registro:', err);
      
      if (err.response) {
        // Erro com resposta do servidor
        console.error('Dados do erro:', err.response.data);
        console.error('Status do erro:', err.response.status);
        Alert.alert('Erro de Registro', err.response.data.message || 'Erro ao registrar usuário');
      } else if (err.request) {
        // Erro sem resposta (provavelmente problema de conexão)
        console.error('Erro de requisição (sem resposta):', err.request);
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.');
      } else {
        // Outros erros
        console.error('Mensagem de erro:', err.message);
        Alert.alert('Erro', err.message || 'Ocorreu um erro inesperado');
      }
      
      dispatch({
        type: 'REGISTER_FAIL',
        payload: err.response?.data?.message || err.message || 'Erro ao registrar'
      });
    }
  };

  // Logout
  const logout = async () => {
    dispatch({ type: 'LOGOUT' });
    return Promise.resolve();
  };

  // Atualizar usuário
  const updateUser = (user: User) => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // Limpar erros
  const clearErrors = () => dispatch({ type: 'CLEAR_ERRORS' });

  return (
    <AuthContext.Provider value={{ state, login, register, logout, clearErrors, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

function setIsLoading(arg0: boolean) {
  throw new Error('Function not implemented.');
}
