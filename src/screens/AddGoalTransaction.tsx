// src/screens/AddGoalTransaction.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { Goal } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type AddGoalTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddGoalTransaction'>;
type AddGoalTransactionScreenRouteProp = RouteProp<RootStackParamList, 'AddGoalTransaction'>;

const AddGoalTransaction = () => {
  const navigation = useNavigation<AddGoalTransactionScreenNavigationProp>();
  const route = useRoute<AddGoalTransactionScreenRouteProp>();
  const { colors } = useTheme();
  
  const { goalId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  
  // Estados para formulário
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/goals/${goalId}`);
      setGoal(response.data);
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da meta');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido');
      return;
    }

    // Validar retirada não maior que saldo atual
    if (type === 'withdraw' && goal && parseFloat(amount) > goal.currentAmount) {
      Alert.alert('Erro', 'O valor da retirada não pode ser maior que o saldo atual');
      return;
    }

    try {
      setSaving(true);
      
      const data = {
        amount: parseFloat(amount),
        type,
        description,
        date
      };
      
      const response = await api.post(`/api/goals/${goalId}/transaction`, data);
      
      Alert.alert(
        'Sucesso',
        'Transação adicionada com sucesso',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a transação');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
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
          Meta não encontrada
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Adicionar Transação</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Resumo da Meta */}
        <View style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
          <View style={styles.goalInfo}>
            <View style={styles.goalInfoItem}>
              <Text style={[styles.goalInfoLabel, { color: colors.textSecondary }]}>Saldo Atual</Text>
              <Text style={[styles.goalInfoValue, { color: colors.success }]}>
                {formatCurrency(goal.currentAmount)}
              </Text>
            </View>
            <View style={styles.goalInfoItem}>
              <Text style={[styles.goalInfoLabel, { color: colors.textSecondary }]}>Meta</Text>
              <Text style={[styles.goalInfoValue, { color: colors.text }]}>
                {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tipo de Transação */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'deposit' && { backgroundColor: colors.success + '20' },
              { borderColor: colors.border }
            ]}
            onPress={() => setType('deposit')}
          >
            <Ionicons 
              name={"arrow-down-circle" as any} 
              size={24} 
              color={colors.success} 
            />
            <Text style={[
              styles.typeText, 
              { color: type === 'deposit' ? colors.success : colors.textSecondary }
            ]}>
              Depósito
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'withdraw' && { backgroundColor: colors.danger + '20' },
              { borderColor: colors.border }
            ]}
            onPress={() => setType('withdraw')}
          >
            <Ionicons 
              name={"arrow-up-circle" as any} 
              size={24} 
              color={colors.danger} 
            />
            <Text style={[
              styles.typeText, 
              { color: type === 'withdraw' ? colors.danger : colors.textSecondary }
            ]}>
              Retirada
            </Text>
          </TouchableOpacity>
        </View>

        {/* Valor */}
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valor</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="R$ 0,00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
        
        {/* Descrição */}
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Ex: Depósito mensal, Pagamento parcial, etc."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        
        {/* Data */}
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Data</Text>
          <TouchableOpacity 
            style={[styles.dateInput, { backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>
              {date.toLocaleDateString('pt-BR')}
            </Text>
            <Ionicons name={"calendar-outline" as any} size={20} color={colors.primary} />
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
        
        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Adicionar Transação</Text>
          )}
        </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  goalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalInfoItem: {
    alignItems: 'center',
  },
  goalInfoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  goalInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  saveButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default AddGoalTransaction;