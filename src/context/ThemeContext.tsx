// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useAuth } from './AuthContext';

type ThemeType = 'light' | 'dark' | 'system';

interface ColorTheme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
}

const lightColors: ColorTheme = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#2e2e2e',
  textSecondary: '#666666',
  border: '#e0e0e0',
  primary: '#6200ee',
  secondary: '#03dac6',
  success: 'green',
  danger: 'red',
  warning: '#f5a623',
  info: '#2196f3'
};

const darkColors: ColorTheme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#2c2c2c',
  primary: '#bb86fc',
  secondary: '#03dac6',
  success: '#00c853',
  danger: '#ff5252',
  warning: '#ffab40',
  info: '#64b5f6'
};

interface ThemeContextProps {
  theme: ThemeType;
  isDark: boolean;
  colors: ColorTheme;
  setTheme: (theme: ThemeType) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar tema salvo
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme as ThemeType)) {
          setThemeState(savedTheme as ThemeType);
        } else if (state.user && state.user.theme) {
          setThemeState(state.user.theme as ThemeType);
        }
      } catch (error) {
        console.error('Erro ao carregar tema:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [state.user]);

  // Determinar se é tema escuro com base nas configurações
  const isDark = theme === 'system' 
    ? systemColorScheme === 'dark'
    : theme === 'dark';

  // Obter as cores com base no tema atual
  const colors = isDark ? darkColors : lightColors;

  // Função para alterar o tema
  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
    
    // Atualizar preferência do usuário no servidor se estiver autenticado
    if (state.isAuthenticated) {
      try {
        await api.put('/api/user/preferences', { theme: newTheme });
      } catch (error) {
        console.error('Erro ao atualizar tema no servidor:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme }}>
      {!isLoading && children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};