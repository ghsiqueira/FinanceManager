// App.tsx
import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineAlert from './src/components/OfflineAlert';
import api from './src/services/api';

export default function App() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    
    // Testar a conexão com o servidor
    api.get('/')
      .then(() => {
        console.log('Conexão com o servidor restaurada');
        // Força recarregar o app (na prática, apenas mostra um indicador)
        setTimeout(() => setIsRetrying(false), 1000);
      })
      .catch(err => {
        console.error('Erro ao tentar reconectar:', err);
        setIsRetrying(false);
      });
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <OfflineAlert onRetry={handleRetry} />
          <AppNavigator />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}