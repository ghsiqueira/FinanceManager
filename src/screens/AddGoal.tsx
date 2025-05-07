// src/screens/AddGoal.tsx
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

type AddGoalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddGoal'>;

const AddGoal = () => {
  const navigation = useNavigation<AddGoalScreenNavigationProp>();
  const { colors } = useTheme();
  
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [isExpense, setIsExpense] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Categorias disponíveis
  const categories = isExpense ? 
    ['Viagem', 'Compra', 'Presentes', 'Educação', 'Saúde', 'Outros'] : 
    ['Emergência', 'Aposentadoria', 'Educação', 'Casa Própria', 'Férias', 'Outros'];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const handleSubmit = async () => {
    // Validação
    if (!title) {
      Alert.alert('Erro', 'O título da meta é obrigatório');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Insira um valor válido para a meta');
      return;
    }

    const currentDate = new Date();
    if (targetDate <= currentDate) {
      Alert.alert('Erro', 'A data alvo deve ser futura');
      return;
    }

    try {
      setIsLoading(true);

      const parsedAmount = parseFloat(targetAmount.replace(',', '.'));
      
      await api.post('/api/goals', {
        title,
        targetAmount: parsedAmount,
        targetDate,
        isExpense,
        category: category || undefined,
        description: description || undefined
      });
      
      Alert.alert('Sucesso', 'Meta adicionada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao adicionar meta:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a meta.');
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Adicionar Meta</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tipo de Meta */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo de Meta</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {isExpense ? 'Gasto Planejado' : 'Meta de Economia'}
            </Text>
            <Switch
              value={isExpense}
              onValueChange={setIsExpense}
              trackColor={{ false: colors.success + '40', true: colors.warning + '40' }}
              thumbColor={isExpense ? colors.warning : colors.success}
            />
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {isExpense
              ? 'Use para planejar gastos futuros como viagens, presentes ou compras.'
              : 'Use para definir objetivos de economia como emergência, casa própria ou aposentadoria.'}
          </Text>
        </View>

        {/* Título */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Título da Meta</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            placeholder="Ex: Férias, Novo Carro, Reserva de Emergência..."
            placeholderTextColor={colors.textSecondary + '80'}
            value={title}
            onChangeText={setTitle}
          />
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
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
          </View>
        </View>

        {/* Data */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Data Alvo</Text>
          <TouchableOpacity 
            style={[styles.dateSelector, { borderColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>{formatDate(targetDate)}</Text>
            <Ionicons name={"calendar" as any} size={20} color={colors.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={targetDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Categoria */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria (opcional)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
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
            </ScrollView>
          </View>
  
          {/* Descrição */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, height: 100 }]}
              placeholder="Adicione detalhes sobre sua meta..."
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
              <Text style={styles.submitButtonText}>Salvar Meta</Text>
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
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    description: {
      fontSize: 12,
      lineHeight: 18,
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
    dateSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
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
  
  export default AddGoal;