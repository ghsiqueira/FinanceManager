// src/screens/Home.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Transaction, Goal, Budget } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';
import TransactionItem from '../components/TransactionItem';
import CategoryChart from '../components/CategoryChart';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Stats {
  income: number;
  expense: number;
  fixedExpense: number;
  variableExpense: number;
  balance: number;
  categorySummary: {
    [key: string]: {
      income: number;
      expense: number;
      fixedExpense: number;
      variableExpense: number;
    }
  };
}

const Home = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { state } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forecast, setForecast] = useState<any[]>([]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/transactions');
      setTransactions(res.data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas transações.');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`/api/stats?period=${period}`);
      setStats(res.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas estatísticas.');
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get('/api/goals');
      // Pegar apenas as 3 metas mais próximas do prazo
      setGoals(res.data.slice(0, 3));
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/api/budgets');
      setBudgets(res.data);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
    }
  };

  const fetchForecast = async () => {
    try {
      const res = await api.get('/api/forecast?months=3');
      setForecast(res.data.forecast);
    } catch (error) {
      console.error('Erro ao buscar previsão:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTransactions(),
      fetchStats(),
      fetchGoals(),
      fetchBudgets(),
      fetchForecast()
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [period])
  );

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const calculateProgress = (currentAmount: number, targetAmount: number) => {
    return Math.min(Math.max((currentAmount / targetAmount) * 100, 0), 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Calcular progresso dos orçamentos
  const calculateBudgetProgress = (budget: Budget) => {
    if (!stats || !stats.categorySummary[budget.category]) return 0;
    
    const spent = stats.categorySummary[budget.category].expense;
    return (spent / budget.amount) * 100;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.text }]}>Olá, {state.user?.name}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Goals')}
            >
              <Ionicons name={"flag-outline" as any} size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name={"settings-outline" as any} size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card de Saldo */}
        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceTitle, { color: colors.textSecondary }]}>Saldo Atual</Text>
            <View style={styles.periodSelector}>
              <TouchableOpacity 
                style={[
                  styles.periodButton, 
                  period === 'week' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setPeriod('week')}
              >
                <Text style={{ 
                  color: period === 'week' ? '#fff' : colors.textSecondary,
                  fontSize: 12
                }}>Semana</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.periodButton, 
                  period === 'month' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setPeriod('month')}
              >
                <Text style={{ 
                  color: period === 'month' ? '#fff' : colors.textSecondary,
                  fontSize: 12
                }}>Mês</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.periodButton, 
                  period === 'year' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setPeriod('year')}
              >
                <Text style={{ 
                  color: period === 'year' ? '#fff' : colors.textSecondary,
                  fontSize: 12
                }}>Ano</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading && !stats ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
          ) : stats ? (
            <>
              <Text style={[styles.balanceAmount, { 
                color: stats.balance >= 0 ? colors.success : colors.danger 
              }]}>
                {formatCurrency(stats.balance)}
              </Text>
              
              <View style={styles.balanceDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Receitas</Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>
                    {formatCurrency(stats.income)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Despesas</Text>
                  <Text style={[styles.detailValue, { color: colors.danger }]}>
                    {formatCurrency(stats.expense)}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={[styles.balanceAmount, { color: colors.textSecondary }]}>
              Dados indisponíveis
            </Text>
          )}
        </View>

        {/* Seção de Metas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Metas</Text>
            {goals.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>Ver Todas</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {goals.length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.goalsContainer}
            >
              {goals.map((goal) => {
                const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                return (
                  <TouchableOpacity 
                    key={goal._id}
                    style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('GoalDetail', { goalId: goal._id })}
                  >
                    <Text style={[styles.goalTitle, { color: colors.text }]} numberOfLines={1}>
                      {goal.title}
                    </Text>
                    <View style={styles.goalProgressBar}>
                      <View 
                        style={[
                          styles.goalProgressFill, 
                          { 
                            width: `${progress}%`, 
                            backgroundColor: goal.isExpense ? colors.warning : colors.success 
                          }
                        ]} 
                      />
                    </View>
                    <View style={styles.goalDetails}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </Text>
                      <Text style={{ color: colors.primary, fontSize: 12 }}>
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity 
                style={[styles.addGoalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('AddGoal')}
              >
                <Ionicons name={"add-circle" as any} size={30} color={colors.primary} />
                <Text style={[styles.addGoalText, { color: colors.primary }]}>Nova Meta</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={[styles.emptyGoalsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={"flag-outline" as any} size={48} color={colors.primary} />
              <Text style={[styles.emptyGoalsText, { color: colors.text }]}>Você ainda não tem metas</Text>
              <Text style={[styles.emptyGoalsSubtext, { color: colors.textSecondary }]}>
                Crie metas financeiras para acompanhar seu progresso
              </Text>
              <TouchableOpacity 
                style={[styles.addFirstGoalButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('AddGoal')}
              >
                <Text style={styles.addFirstGoalButtonText}>Criar Primeira Meta</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Seção de Orçamentos */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Orçamentos</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Budgets')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>Ver Todos</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.budgetsContainer}
            >
              {budgets.map((budget) => {
                const progress = calculateBudgetProgress(budget);
                return (
                  <TouchableOpacity 
                    key={budget._id}
                    style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => navigation.navigate('EditBudget', { budgetId: budget._id })}
                  >
                    <Text style={[styles.budgetTitle, { color: colors.text }]} numberOfLines={1}>
                      {budget.category}
                    </Text>
                    <View style={styles.budgetProgressBar}>
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
                    <View style={styles.budgetDetails}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {stats && stats.categorySummary[budget.category] 
                          ? formatCurrency(stats.categorySummary[budget.category].expense) 
                          : 'R$ 0,00'} / {formatCurrency(budget.amount)}
                      </Text>
                      <Text style={{ 
                        color: progress > 100 ? colors.danger : colors.primary, 
                        fontSize: 12 
                      }}>
                        {progress.toFixed(0)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity 
                style={[styles.addBudgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('AddBudget')}
              >
                <Ionicons name={"add-circle" as any} size={30} color={colors.primary} />
                <Text style={[styles.addBudgetText, { color: colors.primary }]}>Novo Orçamento</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Seção de Previsão Financeira */}
        {forecast.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Previsão Financeira</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrevisaoFinanceira')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>Ver Detalhes</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.forecastCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {forecast.map((item, index) => {
                const date = new Date(item.date);
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                const monthName = monthNames[date.getMonth()];
                
                return (
                  <View key={index} style={styles.forecastItem}>
                    <Text style={[styles.forecastMonth, { color: colors.text }]}>
                      {monthName}/{date.getFullYear()}
                    </Text>
                    <View style={styles.forecastDetails}>
                      <View style={styles.forecastDetailColumn}>
                        <Text style={[styles.forecastDetailLabel, { color: colors.textSecondary }]}>
                          Receitas
                        </Text>
                        <Text style={[styles.forecastDetailValue, { color: colors.success }]}>
                          {formatCurrency(item.totalIncome)}
                        </Text>
                      </View>
                      <View style={styles.forecastDetailColumn}>
                        <Text style={[styles.forecastDetailLabel, { color: colors.textSecondary }]}>
                          Despesas
                        </Text>
                        <Text style={[styles.forecastDetailValue, { color: colors.danger }]}>
                          {formatCurrency(item.totalExpense)}
                        </Text>
                      </View>
                      <View style={styles.forecastDetailColumn}>
                        <Text style={[styles.forecastDetailLabel, { color: colors.textSecondary }]}>
                          Saldo
                        </Text>
                        <Text style={[styles.forecastDetailValue, { 
                          color: item.monthlyBalance >= 0 ? colors.success : colors.danger 
                        }]}>
                          {formatCurrency(item.monthlyBalance)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              
              <View style={styles.forecastTotal}>
                <Text style={[styles.forecastTotalLabel, { color: colors.textSecondary }]}>
                  Saldo Acumulado em {new Date(forecast[forecast.length - 1].date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </Text>
                <Text style={[styles.forecastTotalValue, { 
                  color: forecast[forecast.length - 1].accumulatedBalance >= 0 ? colors.success : colors.danger 
                }]}>
                  {formatCurrency(forecast[forecast.length - 1].accumulatedBalance)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Categorias */}
        {stats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Categorias</Text>
            </View>
            
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.chartTabs}>
                <TouchableOpacity style={[styles.chartTab, styles.activeChartTab]}>
                  <Text style={[styles.chartTabText, { color: colors.primary }]}>Despesas</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.chartContainer}>
                <CategoryChart 
                  data={Object.entries(stats.categorySummary)
                    .filter(([_, values]) => values.expense > 0)
                    .map(([category, values]) => ({
                      category,
                      value: values.expense,
                      percentage: (values.expense / stats.expense) * 100
                    }))}
                  isDark={isDark}
                  colors={colors}
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Últimas Transações</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>Ver Todas</Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.transactionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {loading && transactions.length === 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
            ) : transactions.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Nenhuma transação encontrada
              </Text>
            ) : (
              transactions.slice(0, 5).map(transaction => (
                <TransactionItem
                  key={transaction._id}
                  transaction={transaction}
                  onPress={() => {
                    console.log('Navegando para EditTransaction com ID:', transaction._id);
                    if (transaction._id) {
                      navigation.navigate('EditTransaction', { transactionId: transaction._id });
                    } else {
                      console.error('ID da transação é inválido:', transaction);
                      Alert.alert('Erro', 'Não foi possível editar esta transação.');
                    }
                  }}
                  colors={colors}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>
      
      {/* Botão Flutuante */}
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddTransaction')}
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
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 20,
  },
  balanceCard: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceTitle: {
    fontSize: 14,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
  },
  periodButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
  },
  chartCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chartTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  activeChartTab: {
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  chartTabText: {
    fontWeight: '600',
  },
  chartContainer: {
    height: 200,
    marginBottom: 8,
  },
  transactionsCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
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
  goalsContainer: {
    paddingLeft: 20,
  },
  goalCard: {
    width: 200,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addGoalCard: {
    width: 120,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addGoalText: {
    marginTop: 8,
    fontWeight: '600',
  },
  budgetsContainer: {
    paddingLeft: 20,
  },
  budgetCard: {
    width: 200,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  budgetProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addBudgetCard: {
    width: 120,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBudgetText: {
    marginTop: 8,
    fontWeight: '600',
  },
  forecastCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  forecastItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  forecastMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  forecastDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastDetailColumn: {
    flex: 1,
    alignItems: 'center',
  },
  forecastDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  forecastDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  forecastTotal: {
    marginTop: 8,
    alignItems: 'center',
  },
  forecastTotalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  forecastTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  emptyGoalsContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  emptyGoalsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyGoalsSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  addFirstGoalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstGoalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },  
});

export default Home;