// src/screens/Investments.tsx
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
import { Investment } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type InvestmentsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Investments'>;

const Investments = () => {
  const navigation = useNavigation<InvestmentsScreenNavigationProp>();
  const { colors } = useTheme();
  
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/investments');
      setInvestments(res.data);
      
      // Calcular valor total
      const total = res.data.reduce((sum: number, investment: Investment) => 
        sum + investment.currentAmount, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus investimentos.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchInvestments();
    }, [])
  );

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateReturn = (investment: Investment) => {
    const returnValue = ((investment.currentAmount - investment.initialAmount) / investment.initialAmount) * 100;
    return returnValue.toFixed(2);
  };

  const renderInvestmentItem = ({ item }: { item: Investment }) => {
    const returnPercentage = calculateReturn(item);
    const isPositiveReturn = parseFloat(returnPercentage) >= 0;
    
    return (
      <TouchableOpacity 
        style={[styles.investmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('InvestmentDetail', { investmentId: item._id })}
      >
        <View style={styles.investmentHeader}>
          <Text style={[styles.investmentName, { color: colors.text }]}>{item.name}</Text>
          <View style={[
            styles.typeTag, 
            { backgroundColor: colors.primary + '20' }
          ]}>
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {item.type}
            </Text>
          </View>
        </View>
        
        <View style={styles.investmentValue}>
          <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>Valor Atual</Text>
          <Text style={[styles.valueAmount, { color: colors.text }]}>
            {formatCurrency(item.currentAmount)}
          </Text>
        </View>
        
        <View style={styles.investmentDetails}>
          <View style={styles.detailColumn}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Valor Inicial</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatCurrency(item.initialAmount)}
            </Text>
          </View>
          
          <View style={styles.detailColumn}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Retorno</Text>
            <Text style={[styles.detailValue, { 
              color: isPositiveReturn ? colors.success : colors.danger 
            }]}>
              {isPositiveReturn ? '+' : ''}{returnPercentage}%
            </Text>
          </View>
          
          <View style={styles.detailColumn}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Início</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(item.startDate)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && investments.length === 0) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Investimentos</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Investimentos</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Card de Total */}
      <View style={[styles.totalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
          Valor Total Investido
        </Text>
        <Text style={[styles.totalAmount, { color: colors.text }]}>
          {formatCurrency(totalValue)}
        </Text>
      </View>
      
      {investments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={"trending-up-outline" as any} 
            size={64} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Nenhum investimento encontrado
          </Text>
          <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
            Adicione seus investimentos para acompanhar seu desempenho
          </Text>
        </View>
      ) : (
        <FlatList
          data={investments}
          keyExtractor={item => item._id}
          renderItem={renderInvestmentItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddInvestment')}
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
  totalCard: {
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
  totalLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  investmentCard: {
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
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  investmentName: {
    fontSize: 18,
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
  investmentValue: {
    marginBottom: 16,
  },
  valueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  valueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  investmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailColumn: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
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

export default Investments;