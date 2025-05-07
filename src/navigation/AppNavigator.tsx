// src/navigation/AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
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

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      <NavigationContainer theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.card,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          }
        }
      }}>
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
              <Stack.Screen name="Budgets" component={Budgets} />
              <Stack.Screen name="AddBudget" component={AddBudget} />
              <Stack.Screen name="EditBudget" component={EditBudget} />
              <Stack.Screen name="Investments" component={Investments} />
              <Stack.Screen name="AddInvestment" component={AddInvestment} />
              <Stack.Screen name="InvestmentDetail" component={InvestmentDetail} />
              <Stack.Screen name="AddInvestmentTransaction" component={AddInvestmentTransaction} />
              <Stack.Screen name="Settings" component={Settings} />
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