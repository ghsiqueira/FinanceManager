// src/screens/EditTransaction.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
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
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  
  // Estados para formulário
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Categorias
  const incomeCategories = ['Salário', 'Investimento', 'Freelance', 'Bônus', 'Outros'];
  const expenseCategories = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      console.log('Buscando transação com ID:', transactionId);
      
      if (!transactionId) {
        console.error('ID da transação é undefined ou nulo');
        Alert.alert(
          'Erro', 
          'ID da transação inválido. Retornando à tela anterior.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      const response = await api.get(`/api/transactions/${transactionId}`);
      const transactionData = response.data;
      
      console.log('Transação carregada:', transactionData);
      
      setTransaction(transactionData);
      
      // Preencher o formulário com os dados da transação
      setAmount(transactionData.amount.toString());
      setType(transactionData.type);
      setCategory(transactionData.category);
      setDescription(transactionData.description || '');
      setIsFixed(transactionData.isFixed || false);
      setDate(new Date(transactionData.date));
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      Alert.alert(
        'Erro', 
        'Não foi possível carregar os dados da transação. Retornando à tela anterior.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido');
      return;
    }

    if (!category) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria');
      return;
    }

    try {
      setSaving(true);
      
      const data = {
        amount: parseFloat(amount),
        type,
        category,
        description,
        isFixed,
        date
      };
      
      await api.put(`/api/transactions/${transactionId}`, data);
      
      Alert.alert(
        'Sucesso',
        'Transação atualizada com sucesso',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a transação');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
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
              await api.delete(`/api/transactions/${transactionId}`);
              Alert.alert('Sucesso', 'Transação excluída com sucesso');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir transação:', error);
              Alert.alert('Erro', 'Não foi possível excluir a transação');
            }
          } 
        }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos
    let numericValue = value.replace(/[^0-9]/g, '');
    
    // Converte para número
    const numeric = parseInt(numericValue) / 100;
    
    // Formata como moeda
    return `R$ ${numeric.toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name={"trash-outline" as any} size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'income' && { backgroundColor: colors.success + '20' },
              { borderColor: colors.border }
            ]}
            onPress={() => setType('income')}
          >
            <Ionicons 
              name={"arrow-down-circle" as any} 
              size={24} 
              color={colors.success} 
            />
            <Text style={[
              styles.typeText, 
              { color: type === 'income' ? colors.success : colors.textSecondary }
            ]}>
              Receita
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'expense' && { backgroundColor: colors.danger + '20' },
              { borderColor: colors.border }
            ]}
            onPress={() => setType('expense')}
          >
            <Ionicons 
              name={"arrow-up-circle" as any} 
              size={24} 
              color={colors.danger} 
            />
            <Text style={[
              styles.typeText, 
              { color: type === 'expense' ? colors.danger : colors.textSecondary }
            ]}>
              Despesa
            </Text>
          </TouchableOpacity>
        </View>
        
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
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Categoria</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.card }]}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={{ color: colors.text }}
            >
              <Picker.Item label="Selecione uma categoria" value="" />
              {(type === 'income' ? incomeCategories : expenseCategories).map((cat, index) => (
                <Picker.Item key={index} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Descrição</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Adicionar descrição"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
        
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
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Despesa Fixa</Text>
            <Switch
              value={isFixed}
              onValueChange={setIsFixed}
              trackColor={{ false: colors.border, true: colors.primary + '70' }}
              thumbColor={isFixed ? colors.primary : '#f4f3f4'}
            />
          </View>
          <Text style={[styles.switchDescription, { color: colors.textSecondary }]}>
            Marque esta opção se esta for uma {type === 'income' ? 'receita' : 'despesa'} fixa mensal
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
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
  pickerContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 5,
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
});

export default EditTransaction;