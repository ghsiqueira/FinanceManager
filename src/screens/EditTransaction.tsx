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
import { useTheme } from '../context/ThemeContext';
import { Transaction } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type EditTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTransaction'>;
type EditTransactionScreenRouteProp = RouteProp<RootStackParamList, 'EditTransaction'>;

// Componente principal
const EditTransaction = () => {
  const navigation = useNavigation<EditTransactionScreenNavigationProp>();
  const route = useRoute<EditTransactionScreenRouteProp>();
  const { colors } = useTheme();
  
  const { transactionId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para formulário - com valores padrão seguros
  const [amount, setAmount] = useState('0');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Categorias
  const incomeCategories = ['Salário', 'Investimento', 'Freelance', 'Bônus', 'Outros'];
  const expenseCategories = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'];

  // Verificar se temos um ID válido
  useEffect(() => {
    if (!transactionId) {
      setError('ID da transação não fornecido');
      setLoading(false);
      return;
    }
    
    fetchTransaction();
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!transactionId) {
        throw new Error('ID da transação é undefined ou nulo');
      }
      
      console.log('Buscando transação com ID:', transactionId);
      const response = await api.get(`/api/transactions/${transactionId}`);
      
      if (!response || !response.data) {
        throw new Error('Resposta inválida do servidor');
      }
      
      const transactionData = response.data;
      console.log('Transação carregada:', transactionData);
      
      // Preencher o formulário com os dados da transação
      setAmount(transactionData.amount?.toString() || '0');
      setType(transactionData.type || 'expense');
      setCategory(transactionData.category || '');
      setDescription(transactionData.description || '');
      setIsFixed(transactionData.isFixed || false);
      
      // Tratar a data com segurança
      try {
        setDate(new Date(transactionData.date));
      } catch (e) {
        console.error('Erro ao processar data:', e);
        setDate(new Date());
      }
      
    } catch (error) {
      console.error('Erro ao buscar transação:', error);
      setError('Não foi possível carregar os dados da transação');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validações
      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Erro', 'Por favor, informe um valor válido');
        return;
      }

      if (!category) {
        Alert.alert('Erro', 'Por favor, selecione uma categoria');
        return;
      }
      
      // Verificar se o ID da transação existe
      if (!transactionId) {
        Alert.alert('Erro', 'ID da transação não encontrado');
        return;
      }

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
    // Verificar se o ID da transação existe
    if (!transactionId) {
      Alert.alert('Erro', 'ID da transação não encontrado');
      return;
    }
    
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

  // Manipulador para mudança de data
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Renderização quando houver erro
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name={"alert-circle-outline" as any} size={60} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchTransaction}
          >
            <Text style={{ color: '#fff' }}>Tentar Novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: colors.text }}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Renderização durante o carregamento
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Transação</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando dados...</Text>
        </View>
      </View>
    );
  }

  // Renderização principal
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
          <View style={styles.categorySelector}>
            {(type === 'income' ? incomeCategories : expenseCategories).map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryButton,
                  category === cat && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text 
                  style={{ 
                    color: category === cat ? '#fff' : colors.text,
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
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
  // Container para estados de erro e carregamento
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  // Conteúdo principal
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
  // Seletor de categorias em forma de botões
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 5,
    borderWidth: 1,
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