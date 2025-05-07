// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Telas de Autenticação
import Login from '../screens/Login';
import Register from '../screens/Register';

// Telas Principais
import Home from '../screens/Home';
import AddTransaction from '../screens/AddTransaction';
import EditTransaction from '../screens/EditTransaction';

// Telas de Metas
import Goals from '../screens/Goals';
import AddGoal from '../screens/AddGoal';
import GoalDetail from '../screens/GoalDetail';

// Telas de Orçamentos
import Budgets from '../screens/Budgets';
import AddBudget from '../screens/AddBudget';
import EditBudget from '../screens/EditBudget';

// Telas de Investimentos
import Investments from '../screens/Investments';
import AddInvestment from '../screens/AddInvestment';
import InvestmentDetail from '../screens/InvestmentDetail';
import AddInvestmentTransaction from '../screens/AddInvestmentTransaction';

import EditGoal from '../screens/EditGoal';
import EditProfile from '../screens/EditProfile';
import PrevisaoFinanceira from '../screens/PrevisaoFinanceira';

// Configurações
import Settings from '../screens/Settings';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { state } = useAuth();
  const { isAuthenticated, isLoading } = state;
  const { isDark, colors } = useTheme();

  if (isLoading) {
    // Você pode criar uma tela de splash aqui se quiser
    return null;
  }

  // Criar um tema personalizado baseado no DefaultTheme
  const customTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    }
  };

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      <NavigationContainer theme={customTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            // Rotas autenticadas
            <>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="AddTransaction" component={AddTransaction} />
              <Stack.Screen name="EditTransaction" component={EditTransaction} />
              <Stack.Screen name="Goals" component={Goals} />
              <Stack.Screen name="AddGoal" component={AddGoal} />
              <Stack.Screen name="GoalDetail" component={GoalDetail} />
              <Stack.Screen name="EditGoal" component={EditGoal} /> {/* Nova rota */}
              <Stack.Screen name="Budgets" component={Budgets} />
              <Stack.Screen name="AddBudget" component={AddBudget} />
              <Stack.Screen name="EditBudget" component={EditBudget} />
              <Stack.Screen name="Investments" component={Investments} />
              <Stack.Screen name="AddInvestment" component={AddInvestment} />
              <Stack.Screen name="InvestmentDetail" component={InvestmentDetail} />
              <Stack.Screen name="AddInvestmentTransaction" component={AddInvestmentTransaction} />
              <Stack.Screen name="Settings" component={Settings} />
              <Stack.Screen name="EditProfile" component={EditProfile} /> {/* Nova rota */}
              <Stack.Screen name="PrevisaoFinanceira" component={PrevisaoFinanceira} /> {/* Nova rota */}
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
    </>
  );
};

export default AppNavigator;