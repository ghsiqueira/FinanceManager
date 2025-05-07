// src/screens/EditTransaction.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Switch,
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
import { Transaction } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type EditTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTransaction'>;
type EditTransactionScreenRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;

const EditTransaction = () => {
  const navigation = useNavigation<EditTransactionScreenNavigationProp>();
  const route = useRoute<EditTransactionScreenRouteProp>();
  const { colors } = useTheme();
  
  const { transactionId } = route.params;
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [isFixed, setIsFixed] = useState(false);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Categorias disponíveis
  const expenseCategories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'];
  const incomeCategories = ['Salário', 'Investimentos', 'Freelance', 'Outros'];

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/transactions/${transactionId}`);
        const transaction: Transaction = res.data;
        
        setAmount(transaction.amount.toString());
        setType(transaction.type);
        setCategory(transaction.category);
        setDescription(transaction.description || '');
        setDate(new Date(transaction.date));
        setIsFixed(transaction.isFixed || false);
        setIsRecurrent(transaction.recurrence?.isRecurrent || false);
        setFrequency(transaction.recurrence?.frequency || 'monthly');
      } catch (error) {
        console.error('Erro ao buscar transação:', error);
        Alert.alert('Erro', 'Não foi possível carregar os detalhes da transação.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransaction();
  }, [transactionId]);

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

    if (!category) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    try {
      setSubmitting(true);
      
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      
      await api.put(`/api/transactions/${transactionId}`, {
        amount: parsedAmount,
        type,
        category,
        description: description || '',
        date,
        isFixed,
        recurrence: {
          isRecurrent,
          frequency,
          dayOfMonth: isRecurrent ? date.getDate() : undefined,
          dayOfWeek: isRecurrent ? date.getDay() : undefined,
          month: isRecurrent && frequency === 'yearly' ? date.getMonth() : undefined,
          nextDate: isRecurrent ? date : undefined
        }
      });
      
      Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a transação.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await api.delete(`/api/transactions/${transactionId}`);
              Alert.alert('Sucesso', 'Transação excluída com sucesso!');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir transação:', error);
              Alert.alert('Erro', 'Não foi possível excluir a transação.');
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
          <TouchableOpacity onPress={handleDelete}>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons 
              name={"trash-outline" as any} 
              size={24} 
              color={colors.danger} 
            />
          </TouchableOpacity>
        </View>

        {/* Tipo de Transação */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Transação</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && { backgroundColor: colors.success },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('income')}
            >
              <Text style={{ color: type === 'income' ? '#fff' : colors.text }}>Receita</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && { backgroundColor: colors.danger },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('expense')}
            >
              <Text style={{ color: type === 'expense' ? '#fff' : colors.text }}>Despesa</Text>
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

        {/* Categoria */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {(type === 'income' ? incomeCategories : expenseCategories).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: category === cat ? 
                                    (type === 'income' ? colors.success : colors.danger) : 
                                    colors.background,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text 
                  style={{ 
                    color: category === cat ? '#fff' : colors.text,
                    fontWeight: category === cat ? 'bold' : 'normal'
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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

        {/* Configurações Avançadas */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Configurações Avançadas</Text>
          
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Despesa Fixa</Text>
            <Switch
              value={isFixed}
              onValueChange={setIsFixed}
              trackColor={{ false: '#767577', true: colors.primary + '40' }}
              thumbColor={isFixed ? colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Recorrente</Text>
            <Switch
              value={isRecurrent}
              onValueChange={setIsRecurrent}
              trackColor={{ false: '#767577', true: colors.primary + '40' }}
              thumbColor={isRecurrent ? colors.primary : '#f4f3f4'}
            />
          </View>
          
          {isRecurrent && (
            <View style={styles.frequencyContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Frequência</Text>
              <View style={styles.frequencyButtons}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'monthly' && { backgroundColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFrequency('monthly')}
                >
                  <Text style={{ color: frequency === 'monthly' ? '#fff' : colors.text }}>Mensal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'weekly' && { backgroundColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFrequency('weekly')}
                >
                  <Text style={{ color: frequency === 'weekly' ? '#fff' : colors.text }}>Semanal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'yearly' && { backgroundColor: colors.primary },
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFrequency('yearly')}
                >
                  <Text style={{ color: frequency === 'yearly' ? '#fff' : colors.text }}>Anual</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
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
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  frequencyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  frequencyButtons: {
    flexDirection: 'row',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtons: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditTransaction;