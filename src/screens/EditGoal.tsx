// src/screens/EditGoal.tsx
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
import { Goal } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type EditGoalScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditGoal'>;
type EditGoalScreenRouteProp = RouteProp<RootStackParamList, 'EditGoal'>;

const EditGoal = () => {
  const navigation = useNavigation<EditGoalScreenNavigationProp>();
  const route = useRoute<EditGoalScreenRouteProp>();
  const { colors } = useTheme();
  
  const { goalId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  
  // Estados para formulário
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [isExpense, setIsExpense] = useState(false);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Categorias
  const categories = ['Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Investimento', 'Outros'];

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      console.log('Buscando meta com ID:', goalId);
      const response = await api.get(`/api/goals/${goalId}`);
      const goalData = response.data;
      
      setGoal(goalData);
      
      // Preencher o formulário com os dados da meta
      setTitle(goalData.title);
      setTargetAmount(goalData.targetAmount.toString());
      setCurrentAmount(goalData.currentAmount.toString());
      setTargetDate(new Date(goalData.targetDate));
      setIsExpense(goalData.isExpense);
      setCategory(goalData.category || '');
      setDescription(goalData.description || '');

      console.log('Meta carregada:', goalData.title);
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da meta');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Erro', 'Por favor, informe um título para a meta');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor alvo válido');
      return;
    }

    try {
      setSaving(true);
      console.log('Salvando alterações na meta:', goalId);
      
      const data = {
        title,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        targetDate,
        isExpense,
        category,
        description
      };
      
      await api.put(`/api/goals/${goalId}`, data);
      
      Alert.alert(
        'Sucesso',
        'Meta atualizada com sucesso',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a meta');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/goals/${goalId}`);
              Alert.alert('Sucesso', 'Meta excluída com sucesso');
              navigation.navigate('Goals'); // Navegar para a lista de metas
            } catch (error) {
              console.error('Erro ao excluir meta:', error);
              Alert.alert('Erro', 'Não foi possível excluir a meta');
            }
          } 
        }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos
    let numericValue = value.replace(/[^0-9]/g, '');
    
    // Converte para número
    const numeric = parseInt(numericValue || '0') / 100;
    
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Meta</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name={"trash-outline" as any} size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              !isExpense && { backgroundColor: colors.success + '20' },
              { borderColor: colors.border }
            ]}
            onPress={() => setIsExpense(false)}
          >
            <Ionicons 
              name={"wallet-outline" as any} 
              size={24} 
              color={colors.success} 
            />
            <Text style={[
              styles.typeText, 
              { color: !isExpense ? colors.success : colors.textSecondary }
            ]}>
              Economia
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.typeButton, 
              isExpense && { backgroundColor: colors.warning + '20' },
              { borderColor: colors.border }
            ]}
            onPress={() => setIsExpense(true)}
          >
            <Ionicons 
              name={"cart-outline" as any} 
              size={24} 
              color={colors.warning} 
            />
            <Text style={[
              styles.typeText, 
              { color: isExpense ? colors.warning : colors.textSecondary }
            ]}>
              Gasto Planejado
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Título</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Nome da meta"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valor Alvo</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="R$ 0,00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={targetAmount}
            onChangeText={setTargetAmount}
          />
        </View>
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valor Atual</Text>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="R$ 0,00"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={currentAmount}
            onChangeText={setCurrentAmount}
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
              {categories.map((cat, index) => (
                <Picker.Item key={index} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>
        
        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Data Alvo</Text>
          <TouchableOpacity 
            style={[styles.dateInput, { backgroundColor: colors.card }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: colors.text }}>
              {targetDate.toLocaleDateString('pt-BR')}
            </Text>
            <Ionicons name={"calendar-outline" as any} size={20} color={colors.primary} />
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

export default EditGoal;