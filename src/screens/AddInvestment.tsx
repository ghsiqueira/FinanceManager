// src/screens/AddInvestment.tsx
import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type AddInvestmentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddInvestment'>;

const AddInvestment = () => {
  const navigation = useNavigation<AddInvestmentScreenNavigationProp>();
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'ações' | 'fundos' | 'renda fixa' | 'poupança' | 'outros'>('outros');
  const [initialAmount, setInitialAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [expectedReturn, setExpectedReturn] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Erro', 'O nome do investimento é obrigatório');
      return;
    }

    if (!initialAmount || parseFloat(initialAmount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Insira um valor inicial válido');
      return;
    }

    const parsedInitialAmount = parseFloat(initialAmount.replace(',', '.'));
    const parsedCurrentAmount = currentAmount ? 
      parseFloat(currentAmount.replace(',', '.')) : parsedInitialAmount;
    const parsedExpectedReturn = expectedReturn ? 
      parseFloat(expectedReturn.replace(',', '.')) : undefined;

    try {
      setIsLoading(true);
      
      await api.post('/api/investments', {
        name,
        type,
        initialAmount: parsedInitialAmount,
        currentAmount: parsedCurrentAmount,
        startDate,
        expectedReturn: parsedExpectedReturn,
        description: description || undefined
      });
      
      Alert.alert('Sucesso', 'Investimento adicionado com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar investimento:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o investimento.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Novo Investimento</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Nome */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Nome do Investimento</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: Tesouro Direto, Ações PETR4, Fundo XP..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Tipo */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typesContainer}
          >
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'ações' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('ações')}
            >
              <Text style={{ color: type === 'ações' ? '#fff' : colors.text }}>Ações</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'fundos' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('fundos')}
            >
              <Text style={{ color: type === 'fundos' ? '#fff' : colors.text }}>Fundos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'renda fixa' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('renda fixa')}
            >
              <Text style={{ color: type === 'renda fixa' ? '#fff' : colors.text }}>Renda Fixa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'poupança' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('poupança')}
            >
              <Text style={{ color: type === 'poupança' ? '#fff' : colors.text }}>Poupança</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'outros' && { backgroundColor: colors.primary },
                { borderColor: colors.border }
              ]}
              onPress={() => setType('outros')}
            >
              <Text style={{ color: type === 'outros' ? '#fff' : colors.text }}>Outros</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Valor Inicial */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Valor Inicial</Text>
          <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="decimal-pad"
              value={initialAmount}
              onChangeText={(text) => {
                setInitialAmount(text);
                if (!currentAmount) {
                  setCurrentAmount(text);
                }
              }}
            />
          </View>
        </View>

        {/* Valor Atual */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Valor Atual (opcional)</Text>
          <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>R$</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="decimal-pad"
              value={currentAmount}
              onChangeText={setCurrentAmount}
            />
          </View>
        </View>

        {/* Data de Início */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Data de Início</Text>
          <TouchableOpacity 
            style={[styles.dateSelector, { borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>{formatDate(startDate)}</Text>
            <Ionicons name={"calendar" as any} size={20} color={colors.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Retorno Esperado */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Retorno Esperado (% ao ano, opcional)</Text>
          <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary + '80'}
              keyboardType="decimal-pad"
              value={expectedReturn}
              onChangeText={setExpectedReturn}
            />
            <Text style={[styles.percentSymbol, { color: colors.textSecondary }]}>%</Text>
          </View>
        </View>

        {/* Descrição */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, height: 100 }]}
            placeholder="Adicione detalhes sobre seu investimento..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Botão de Salvar */}
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Salvar Investimento</Text>
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typesContainer: {
    paddingVertical: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
  percentSymbol: {
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

export default AddInvestment;