// src/screens/AddTransaction.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

// Simplificado para evitar problemas de sintaxe
type AddTransactionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddTransaction'>;

interface AddTransactionProps {
  navigation: AddTransactionScreenNavigationProp;
}

// Categorias predefinidas
const incomeCategories = [
  'Salário', 'Investimento', 'Freelance', 'Vendas', 'Outros'
];

const expenseCategories = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 
  'Lazer', 'Vestuário', 'Outros'
];

const AddTransaction: React.FC<AddTransactionProps> = ({ navigation }) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleSubmit = async () => {
    // Validação
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Erro', 'Insira um valor válido');
      return;
    }

    if (!category) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    try {
      setIsLoading(true);
      
      // Formatar o valor para número
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      
      await api.post('/api/transactions', {
        amount: parsedAmount,
        type,
        category,
        description,
        isFixed: type === 'expense' ? isFixed : false, // Apenas despesas podem ser fixas
        date
      });
      
      Alert.alert('Sucesso', 'Transação adicionada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a transação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar as categorias baseadas no tipo selecionado
  const renderCategories = () => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    return categories.map((cat) => (
      <TouchableOpacity
        key={cat}
        style={[
          styles.categoryItem,
          category === cat && styles.categoryItemSelected
        ]}
        onPress={() => {
          setCategory(cat);
          setShowCategoryModal(false);
        }}
      >
        <Text 
          style={[
            styles.categoryText,
            category === cat && styles.categoryTextSelected
          ]}
        >
          {cat}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name={"arrow-back" as any} size={24} color="#2e2e2e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adicionar Transação</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tipo da transação */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'income' && styles.typeButtonIncome,
              { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
            ]}
            onPress={() => {
              setType('income');
              setIsFixed(false); // Resetar a opção de fixo quando mudar para receita
            }}
          >
            <Ionicons 
              name={"arrow-up-circle" as any} 
              size={18} 
              color={type === 'income' ? '#fff' : 'green'} 
            />
            <Text 
              style={[
                styles.typeText, 
                type === 'income' && styles.typeTextSelected
              ]}
            >
              Receita
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              type === 'expense' && styles.typeButtonExpense,
              { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
            ]}
            onPress={() => setType('expense')}
          >
            <Ionicons 
              name={"arrow-down-circle" as any} 
              size={18} 
              color={type === 'expense' ? '#fff' : 'red'} 
            />
            <Text 
              style={[
                styles.typeText, 
                type === 'expense' && styles.typeTextSelected
              ]}
            >
              Despesa
            </Text>
          </TouchableOpacity>
        </View>

        {/* Valor */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Valor</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>R$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Categoria */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity 
            style={styles.categorySelector}
            onPress={() => setShowCategoryModal(!showCategoryModal)}
          >
            <Text style={category ? styles.categoryValue : styles.categoryPlaceholder}>
              {category || 'Selecione uma categoria'}
            </Text>
            <Ionicons name={"chevron-down" as any} size={20} color="#666" />
          </TouchableOpacity>
          
          {showCategoryModal && (
            <View style={styles.categoryModal}>
              <View style={styles.categoryModalContent}>
                {renderCategories()}
              </View>
            </View>
          )}
        </View>

        {/* Descrição */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Descrição (opcional)</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Adicione uma descrição"
            multiline
          />
        </View>

        {/* Opção de despesa fixa (visível apenas para despesas) */}
        {type === 'expense' && (
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Despesa Fixa</Text>
            <View style={styles.switchRow}>
              <Switch
                value={isFixed}
                onValueChange={setIsFixed}
                trackColor={{ false: '#e0e0e0', true: '#6200ee40' }}
                thumbColor={isFixed ? '#6200ee' : '#f4f3f4'}
              />
              <Text style={styles.switchText}>
                {isFixed ? 'Sim' : 'Não'}
              </Text>
            </View>
            <Text style={styles.switchDescription}>
              Marque esta opção para despesas recorrentes como aluguel, assinaturas e contas mensais.
            </Text>
          </View>
        )}

        {/* Botão de enviar */}
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Adicionar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e2e2e',
  },
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  typeButtonIncome: {
    backgroundColor: 'green',
  },
  typeButtonExpense: {
    backgroundColor: 'red',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: '#2e2e2e',
  },
  typeTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySymbol: {
    paddingLeft: 15,
    fontSize: 18,
    color: '#666',
  },
  amountInput: {
    flex: 1,
    padding: 15,
    fontSize: 18,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryPlaceholder: {
    color: '#999',
  },
  categoryValue: {
    color: '#2e2e2e',
  },
  categoryModal: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    zIndex: 999,
    borderRadius: 8,
  },
  categoryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  categoryItemSelected: {
    backgroundColor: '#6200ee20',
  },
  categoryText: {
    fontSize: 16,
    color: '#2e2e2e',
  },
  categoryTextSelected: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  switchContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  switchText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2e2e2e',
  },
  switchDescription: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddTransaction;