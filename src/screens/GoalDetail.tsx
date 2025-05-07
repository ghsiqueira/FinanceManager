// src/screens/GoalDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Goal, GoalTransaction } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type GoalDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GoalDetail'>;
type GoalDetailScreenRouteProp = RouteProp<RootStackParamList, 'GoalDetail'>;

const GoalDetail = () => {
  const navigation = useNavigation<GoalDetailScreenNavigationProp>();
  const route = useRoute<GoalDetailScreenRouteProp>();
  const { colors } = useTheme();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [transactions, setTransactions] = useState<GoalTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Pegar o goalId da rota
  const { goalId } = route.params;

  useEffect(() => {
    fetchGoalData();
  }, [goalId]);

  const fetchGoalData = async () => {
    setLoading(true);
    try {
      const goalRes = await api.get(`/api/goals/${goalId}`);
      setGoal(goalRes.data);
      
      const transactionsRes = await api.get(`/api/goals/${goalId}/history`);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados da meta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da meta.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateProgress = () => {
    if (!goal) return 0;
    return Math.min(Math.max((goal.currentAmount / goal.targetAmount) * 100, 0), 100);
  };

  const addTransaction = () => {
    // Navegar para uma tela de adicionar transação à meta
    // Esta funcionalidade pode ser implementada posteriormente
    Alert.alert(
      'Adicionar Transação',
      'Funcionalidade em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const editGoal = () => {
    if (goal) {
      // Destacando a navegação para a tela de edição
      console.log('Navegando para EditGoal com ID:', goalId);
      navigation.navigate('EditGoal', { goalId: goal._id });
    }
  };

  const deleteGoal = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/goals/${goalId}`);
              Alert.alert('Sucesso', 'Meta excluída com sucesso.');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir meta:', error);
              Alert.alert('Erro', 'Não foi possível excluir a meta.');
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Meta não encontrada ou erro ao carregar.
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes da Meta</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={editGoal}>
            <Ionicons name={"create-outline" as any} size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={deleteGoal}>
            <Ionicons name={"trash-outline" as any} size={24} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{goal.title}</Text>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${calculateProgress()}%`, 
                    backgroundColor: goal.isExpense ? colors.warning : colors.success 
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {calculateProgress().toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.amountContainer}>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Atual</Text>
              <Text style={[styles.amountValue, { color: colors.success }]}>
                {formatCurrency(goal.currentAmount)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Alvo</Text>
              <Text style={[styles.amountValue, { color: colors.text }]}>
                {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Faltam</Text>
              <Text style={[styles.amountValue, { color: colors.danger }]}>
                {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tipo</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {goal.isExpense ? 'Gasto Planejado' : 'Economia'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Categoria</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {goal.category || 'Não Especificada'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Data Alvo</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(goal.targetDate)}
              </Text>
            </View>
          </View>
          
          {goal.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>Descrição</Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {goal.description}
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={addTransaction}
          >
            <Ionicons name={"add" as any} size={20} color="#fff" />
            <Text style={styles.addButtonText}>Adicionar Transação</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.transactionsHeader}>
          <Text style={[styles.transactionsTitle, { color: colors.text }]}>Histórico</Text>
        </View>
        
        {transactions.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name={"calendar-outline" as any} size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Nenhuma transação registrada
            </Text>
          </View>
        ) : (
          transactions.map((transaction, index) => (
            <View 
              key={transaction._id || index}
              style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.transactionHeader}>
                <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
                  {formatDate(transaction.date)}
                </Text>
                <Text 
                  style={[
                    styles.transactionAmount, 
                    { 
                      color: transaction.type === 'deposit' ? colors.success : colors.danger 
                    }
                  ]}
                >
                  {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </Text>
              </View>
              {transaction.description && (
                <Text style={[styles.transactionDescription, { color: colors.text }]}>
                  {transaction.description}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontWeight: 'bold',
    fontSize: 14,
    width: 40,
    textAlign: 'right',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 1,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  transactionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDescription: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default GoalDetail;