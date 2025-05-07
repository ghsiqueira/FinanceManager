// src/screens/Budgets.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Budget } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type BudgetsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Budgets'>;

const Budgets = () => {
  const navigation = useNavigation<BudgetsScreenNavigationProp>();
  const { colors } = useTheme();
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const [budgetsRes, statsRes] = await Promise.all([
        api.get('/api/budgets'),
        api.get('/api/stats?period=month')
      ]);
      
      setBudgets(budgetsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus orçamentos.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchBudgets();
    }, [])
  );

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const calculateBudgetProgress = (budget: Budget) => {
    if (!stats || !stats.categorySummary[budget.category]) return 0;
    
    const spent = stats.categorySummary[budget.category].expense;
    return (spent / budget.amount) * 100;
  };

  const getBudgetSpent = (budget: Budget) => {
    if (!stats || !stats.categorySummary[budget.category]) return 0;
    
    return stats.categorySummary[budget.category].expense;
  };

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const progress = calculateBudgetProgress(item);
    const spent = getBudgetSpent(item);
    
    return (
      <TouchableOpacity 
        style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('EditBudget', { budgetId: item._id })}
      >
        <Text style={[styles.budgetTitle, { color: colors.text }]}>{item.category}</Text>
        
        <View style={styles.budgetProgressContainer}>
          <View 
            style={[
              styles.budgetProgressBar, 
              { backgroundColor: colors.border }
            ]}
          >
            <View 
              style={[
                styles.budgetProgressFill, 
                { 
                  width: `${Math.min(progress, 100)}%`, 
                  backgroundColor: progress > 100 ? colors.danger : 
                                  progress > 75 ? colors.warning : 
                                  colors.success 
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>
        
        <View style={styles.budgetDetails}>
          <Text style={[styles.budgetSpent, { color: colors.text }]}>
            {formatCurrency(spent)} / {formatCurrency(item.amount)}
          </Text>
          
          <View style={styles.periodTag}>
            <Text style={{ color: colors.primary, fontSize: 12 }}>
              {item.period === 'monthly' ? 'Mensal' : 
               item.period === 'weekly' ? 'Semanal' : 'Anual'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && budgets.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Ionicons 
              name={"arrow-back" as any} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Orçamentos</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons 
            name={"arrow-back" as any} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Orçamentos</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={"wallet-outline" as any} 
            size={64} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum orçamento encontrado
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Adicione orçamentos para monitorar seus gastos por categoria
          </Text>
        </View>
      ) : (
        <FlatList
          data={budgets}
          keyExtractor={item => item._id}
          renderItem={renderBudgetItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddBudget')}
      >
        <Ionicons name={"add" as any} size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  budgetCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  budgetProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetSpent: {
    fontSize: 14,
  },
  periodTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Budgets;