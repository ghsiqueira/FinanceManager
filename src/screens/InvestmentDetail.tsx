// src/screens/InvestmentDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Investment, InvestmentTransaction } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type InvestmentDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InvestmentDetail'>;
type InvestmentDetailScreenRouteProp = RouteProp<RootStackParamList, 'InvestmentDetail'>;

const InvestmentDetail = () => {
  const navigation = useNavigation<InvestmentDetailScreenNavigationProp>();
  const route = useRoute<InvestmentDetailScreenRouteProp>();
  const { colors } = useTheme();
  
  const { investmentId } = route.params;
  
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/investments/${investmentId}`);
        setInvestment(res.data);
      } catch (error) {
        console.error('Erro ao buscar investimento:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes do investimento.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    const fetchTransactions = async () => {
      try {
        setTransactionsLoading(true);
        const res = await api.get(`/api/investment-transactions/${investmentId}`);
        setTransactions(res.data);
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
      } finally {
        setTransactionsLoading(false);
      }
    };
    
    fetchInvestment();
    fetchTransactions();
  }, [investmentId]);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateReturn = () => {
    if (!investment) return '0.00';
    
    const returnValue = ((investment.currentAmount - investment.initialAmount) / investment.initialAmount) * 100;
    return returnValue.toFixed(2);
  };

  const handleDeleteInvestment = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este investimento? Todas as transações relacionadas também serão excluídas. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/investments/${investmentId}`);
              Alert.alert('Sucesso', 'Investimento excluído com sucesso!');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir investimento:', error);
              Alert.alert('Erro', 'Não foi possível excluir o investimento.');
            }
          }
        }
      ]
    );
  };

  const renderTransactionItem = ({ item }: { item: InvestmentTransaction }) => {
    const isPositive = item.type === 'aporte' || item.type === 'rendimento';
    
    return (
      <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
          <View style={[
            styles.transactionTypeTag,
            { backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20' }
          ]}>
            <Text style={[
              styles.transactionTypeText,
              { color: isPositive ? colors.success : colors.danger }
            ]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.transactionDetails}>
          {item.description && (
            <Text style={[styles.transactionDescription, { color: colors.text }]}>
              {item.description}
            </Text>
          )}
          <Text style={[
            styles.transactionAmount,
            { color: isPositive ? colors.success : colors.danger }
          ]}>
            {isPositive ? '+' : '-'} {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading || !investment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons 
              name={"arrow-back" as any} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes do Investimento</Text>
          <TouchableOpacity onPress={handleDeleteInvestment}>
            <Ionicons 
              name={"trash-outline" as any} 
              size={24} 
              color={colors.danger} 
            />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  const returnPercentage = calculateReturn();
  const isPositiveReturn = parseFloat(returnPercentage) >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons 
            name={"arrow-back" as any} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes do Investimento</Text>
        <TouchableOpacity onPress={handleDeleteInvestment}>
          <Ionicons 
            name={"trash-outline" as any} 
            size={24} 
            color={colors.danger} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        {/* Card principal */}
        <View style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.investmentHeader}>
            <Text style={[styles.investmentName, { color: colors.text }]}>{investment.name}</Text>
            <View style={[
              styles.typeTag, 
              { backgroundColor: colors.primary + '20' }
            ]}>
              <Text style={[styles.typeText, { color: colors.primary }]}>
                {investment.type}
              </Text>
            </View>
          </View>
          
          <View style={styles.valueContainer}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Valor Atual</Text>
            <Text style={[styles.currentValue, { color: colors.text }]}>
              {formatCurrency(investment.currentAmount)}
            </Text>
          </View>
          
          <View style={styles.detailRows}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Valor Inicial</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatCurrency(investment.initialAmount)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Retorno</Text>
              <Text style={[styles.detailValue, { 
                color: isPositiveReturn ? colors.success : colors.danger 
              }]}>
                {isPositiveReturn ? '+' : ''}{returnPercentage}%
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Data de Início</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(investment.startDate)}
              </Text>
            </View>
            
            {investment.expectedReturn !== undefined && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Retorno Esperado</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {investment.expectedReturn}% ao ano
                </Text>
              </View>
            )}
          </View>
          
          {investment.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descriptionLabel, { color: colors.textSecondary }]}>Descrição</Text>
              <Text style={[styles.description, { color: colors.text }]}>
                {investment.description}
              </Text>
            </View>
          )}
        </View>
        
        {/* Transações */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.transactionsTitle, { color: colors.text }]}>Transações</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('AddInvestmentTransaction', { investmentId })}
              style={[styles.addTransactionButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.addTransactionButtonText}>Nova Transação</Text>
            </TouchableOpacity>
          </View>
          
          {transactionsLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Text style={[styles.emptyTransactionsText, { color: colors.textSecondary }]}>
                Nenhuma transação registrada
              </Text>
            </View>
          ) : (
            <View style={[styles.transactionsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <FlatList
                data={transactions}
                renderItem={renderTransactionItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  mainCard: {
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
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  investmentName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  valueContainer: {
    marginBottom: 20,
  },
  valueLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  detailRows: {
    marginBottom: 20,
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
    fontWeight: '600',
  },
  descriptionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  transactionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addTransactionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addTransactionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTransactions: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    fontSize: 14,
  },
  transactionsList: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  transactionTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDescription: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InvestmentDetail;