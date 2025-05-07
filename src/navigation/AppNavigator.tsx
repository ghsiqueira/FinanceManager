// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Telas
import Login from '../screens/Login';
import Register from '../screens/Register';
import Home from '../screens/Home';
import AddTransaction from '../screens/AddTransaction';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { state } = useAuth();
  const { isAuthenticated, isLoading } = state;

  if (isLoading) {
    // Você pode criar uma tela de splash aqui se quiser
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Rotas autenticadas
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="AddTransaction" component={AddTransaction} />
          </>
        ) : (
          // Rotas não autenticadas
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;