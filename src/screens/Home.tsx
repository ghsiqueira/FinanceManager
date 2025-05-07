// src/screens/Home.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import TransactionItem from '../components/TransactionItem';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeProps {
  navigation: HomeScreenNavigationProp;
}

const Home: React.FC<HomeProps> = ({ navigation }) => {
  const { state, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'fixed'>('all');
  const [totals, setTotals] = useState({
    income: 0,
    expense: 0,
    fixedExpense: 0,
    variableExpense: 0,
    balance: 0
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/transactions');
      setTransactions(res.data);
      
      // Calcular totais
      calculateTotals(res.data);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas transações.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data: Transaction[]) => {
    const income = data
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
      
    const expense = data
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
      
    const fixedExpense = data
      .filter(t => t.type === 'expense' && t.isFixed)
      .reduce((acc, t) => acc + t.amount, 0);
      
    const variableExpense = data
      .filter(t => t.type === 'expense' && !t.isFixed)
      .reduce((acc, t) => acc + t.amount, 0);
      
    setTotals({
      income,
      expense,
      fixedExpense,
      variableExpense,
      balance: income - expense
    });
  };

  // Usar useFocusEffect para recarregar quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [])
  );

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/transactions/${id}`);
      setTransactions(prevTransactions => 
        prevTransactions.filter(t => t._id !== id)
      );
      fetchTransactions(); // Recarregar para atualizar totais
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      Alert.alert('Erro', 'Não foi possível excluir a transação.');
    }
  };

  // Filtrar as transações conforme o filtro selecionado
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.isFixed);

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {state.user?.name}</Text>
        <TouchableOpacity onPress={logout}>
          <Ionicons name={"log-out-outline" as any} size={24} color="#2e2e2e" />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Saldo</Text>
          <Text style={[
            styles.balanceValue, 
            totals.balance >= 0 ? styles.positive : styles.negative
          ]}>
            R$ {totals.balance.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name={"arrow-up-circle" as any} size={20} color="green" />
            <Text style={styles.statLabel}>Receitas</Text>
            <Text style={[styles.statValue, styles.positive]}>
              R$ {totals.income.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name={"arrow-down-circle" as any} size={20} color="red" />
            <Text style={styles.statLabel}>Despesas</Text>
            <Text style={[styles.statValue, styles.negative]}>
              R$ {totals.expense.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Segunda linha com as despesas fixas e variáveis */}
        <View style={styles.statsRowSecondary}>
          <View style={styles.statItem}>
            <Ionicons name={"calendar" as any} size={16} color="#6200ee" />
            <Text style={styles.statLabelSecondary}>Fixas</Text>
            <Text style={[styles.statValueSecondary, styles.negative]}>
              R$ {totals.fixedExpense.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name={"shuffle" as any} size={16} color="#f94144" />
            <Text style={styles.statLabelSecondary}>Variáveis</Text>
            <Text style={[styles.statValueSecondary, styles.negative]}>
              R$ {totals.variableExpense.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filtros para as transações */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('all')}
        >
          <Text 
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive
            ]}
          >
            Todas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            filter === 'fixed' && styles.filterButtonActive
          ]}
          onPress={() => setFilter('fixed')}
        >
          <Text 
            style={[
              styles.filterText,
              filter === 'fixed' && styles.filterTextActive
            ]}
          >
            Despesas Fixas
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>
          {filter === 'all' ? 'Últimas Transações' : 'Despesas Fixas'}
        </Text>
      </View>

      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name={"wallet-outline" as any} size={48} color="#c0c0c0" />
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? 'Nenhuma transação encontrada' 
              : 'Nenhuma despesa fixa encontrada'}
          </Text>
          <Text style={styles.emptySubText}>
            {filter === 'all'
              ? 'Adicione uma nova transação para começar'
              : 'Adicione despesas fixas para melhor controle financeiro'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <TransactionItem 
              transaction={item} 
              onDelete={() => handleDelete(item._id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity 
        style={styles.addButton}
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
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#2e2e2e',
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statsRowSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    height: '100%',
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabelSecondary: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  statValueSecondary: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  positive: {
    color: 'green',
  },
  negative: {
    color: 'red',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#6200ee',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e2e2e',
  },
  viewAllText: {
    color: '#6200ee',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    color: '#2e2e2e',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default Home;