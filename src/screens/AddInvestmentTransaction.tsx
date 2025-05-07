// src/screens/AddInvestmentTransaction.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { Investment } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type AddInvestmentTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddInvestmentTransaction'>;
type AddInvestmentTransactionScreenRouteProp = RouteProp<RootStackParamList, 'AddInvestmentTransaction'>;

const AddInvestmentTransaction = () => {
  const navigation = useNavigation<AddInvestmentTransactionScreenNavigationProp>();
  const route = useRoute<AddInvestmentTransactionScreenRouteProp>();
  const { colors } = useTheme();
  
  const { investmentId } = route.params;
  
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [type, setType] = useState<'aporte' | 'resgate' | 'rendimento'>('aporte');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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
    
    fetchInvestment();
  }, [investmentId]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Insira um valor válido');
      return;
    }

    try {
      setSubmitting(true);
      
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      
      await api.post('/api/investment-transactions', {
        investmentId,
        type,
        amount: parsedAmount,
        date,
        description: description || undefined
      });
      
      Alert.alert('Sucesso', 'Transação adicionada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a transação.');
    } finally {
      setSubmitting(false);
    }
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Transação</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons 
              name={"arrow-back" as any} 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Transação</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Investimento */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Investimento</Text>
          <View style={[styles.investmentInfo, { borderColor: colors.border }]}>
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
        </View>

        {/* Tipo de Transação */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Transação</Text>
          <View style={styles.transactionTypes}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'aporte' && { backgroundColor: colors.success },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('aporte')}
            >
              <Text style={{ color: type === 'aporte' ? '#fff' : colors.text }}>Aporte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'resgate' && { backgroundColor: colors.danger },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('resgate')}
            >
              <Text style={{ color: type === 'resgate' ? '#fff' : colors.text }}>Resgate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'rendimento' && { backgroundColor: colors.warning },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('rendimento')}
            >
              <Text style={{ color: type === 'rendimento' ? '#fff' : colors.text }}>Rendimento</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Valor */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Valor</Text>
          <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        {/* Data */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
          <TouchableOpacity 
            style={[styles.dateSelector, { borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>{formatDate(date)}</Text>
            <Ionicons name={"calendar" as any} size={20} color={colors.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Descrição */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Adicione uma descrição..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Botão de Adicionar */}
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Adicionar Transação</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  investmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
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
  transactionTypes: {
    flexDirection: 'row',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  currencySymbol: {
    paddingHorizontal: 12,
    fontSize: 16,
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    marginHorizontal: 20,
    marginVertical: 30,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddInvestmentTransaction;