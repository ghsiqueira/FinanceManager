// src/screens/Goals.tsx
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
import { Goal } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type GoalsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Goals'>;

const Goals = () => {
  const navigation = useNavigation<GoalsScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/goals');
      setGoals(res.data);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas metas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGoals();
    }, [])
  );

  const calculateProgress = (currentAmount: number, targetAmount: number) => {
    return Math.min(Math.max((currentAmount / targetAmount) * 100, 0), 100);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const calculateMonthlyAmount = (goal: Goal) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    
    // Calcular meses entre hoje e a data alvo
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
      (targetDate.getMonth() - today.getMonth());
    
    if (months <= 0) return 0;
    
    // Calcular valor mensal necessário
    const remaining = goal.targetAmount - goal.currentAmount;
    return remaining / months;
  };

  const renderGoalItem = ({ item }: { item: Goal }) => {
    const progress = calculateProgress(item.currentAmount, item.targetAmount);
    const monthlyAmount = calculateMonthlyAmount(item);

    return (
      <TouchableOpacity 
        style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('GoalDetail', { goalId: item._id })}
      >
        <Text style={[styles.goalTitle, { color: colors.text }]}>{item.title}</Text>
        
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            {item.isExpense ? 'Valor Planejado:' : 'Meta:'}
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(item.targetAmount)}
          </Text>
        </View>
        
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            {item.isExpense ? 'Valor Reservado:' : 'Poupado:'}
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>
            {formatCurrency(item.currentAmount)}
          </Text>
        </View>
        
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar, 
              { backgroundColor: colors.border }
            ]}
          >
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progress}%`, 
                  backgroundColor: item.isExpense ? colors.warning : colors.success
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Até: {formatDate(item.targetDate)}
          </Text>
          {monthlyAmount > 0 && (
            <Text style={[styles.monthlyText, { color: colors.primary }]}>
              {item.isExpense ? 'Reservar ' : 'Poupar '} 
              {formatCurrency(monthlyAmount)}/mês
            </Text>
          )}
        </View>
        
        {item.category && (
          <View style={[styles.categoryTag, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>
              {item.category}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && goals.length === 0) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Minhas Metas</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Minhas Metas</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={"flag-outline" as any} 
            size={64} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhuma meta encontrada
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Adicione metas para acompanhar seu progresso financeiro
          </Text>
        </View>
      ) : (
        <FlatList
          data={goals}
          keyExtractor={item => item._id}
          renderItem={renderGoalItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddGoal')}
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
  goalCard: {
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
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  amountLabel: {
    fontSize: 14,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  dateText: {
    fontSize: 12,
  },
  monthlyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
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

export default Goals;