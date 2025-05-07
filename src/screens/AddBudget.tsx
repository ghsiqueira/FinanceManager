// src/screens/AddBudget.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type AddBudgetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddBudget'>;

const AddBudget = () => {
  const navigation = useNavigation<AddBudgetScreenNavigationProp>();
  const { colors } = useTheme();
  
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  // Lista de categorias comuns
  const categories = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Outros'];

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Erro', 'Selecione uma categoria');
      return;
    }

    if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Insira um valor válido');
      return;
    }

    try {
      setIsLoading(true);
      
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      
      await api.post('/api/budgets', {
        category,
        amount: parsedAmount,
        period
      });
      
      Alert.alert('Sucesso', 'Orçamento adicionado com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar orçamento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o orçamento.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Novo Orçamento</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.content}>
        {/* Categoria */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  { 
                    backgroundColor: category === cat ? colors.primary : colors.background,
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
          </View>
          
          {/* Input para categoria personalizada */}
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, marginTop: 12 }]}
            placeholder="Ou digite uma categoria personalizada..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={!categories.includes(category) ? category : ''}
            onChangeText={setCategory}
          />
        </View>
        
        {/* Valor */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Valor Limite</Text>
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
        
        {/* Período */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Período</Text>
          <View style={styles.periodButtons}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === 'monthly' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setPeriod('monthly')}
            >
              <Text style={{ color: period === 'monthly' ? '#fff' : colors.text }}>Mensal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === 'weekly' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setPeriod('weekly')}
            >
              <Text style={{ color: period === 'weekly' ? '#fff' : colors.text }}>Semanal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === 'yearly' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setPeriod('yearly')}
            >
              <Text style={{ color: period === 'yearly' ? '#fff' : colors.text }}>Anual</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Botão de Adicionar */}
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Adicionar Orçamento</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
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
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  periodButtons: {
    flexDirection: 'row',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  addButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddBudget;