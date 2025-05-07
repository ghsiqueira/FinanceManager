// src/screens/EditGoal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { RootStackParamList } from '../types/navigation';

type EditGoalRouteProp = RouteProp<RootStackParamList, 'EditGoal'>;

const EditGoal = () => {
  const route = useRoute<EditGoalRouteProp>();
  const { goalId } = route.params;
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [isExpense, setIsExpense] = useState(false);
  const [category, setCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoalDetails();
  }, []);

  const fetchGoalDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/goals/${goalId}`);
      const goal = res.data;
      
      setTitle(goal.title);
      setDescription(goal.description || '');
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setTargetDate(new Date(goal.targetDate));
      setIsExpense(goal.isExpense);
      setCategory(goal.category || '');
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar detalhes da meta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da meta.');
      navigation.goBack();
    }
  };

  const handleUpdateGoal = async () => {
    if (!title || !targetAmount) {
      Alert.alert('Erro', 'Por favor, preencha o título e o valor alvo da meta.');
      return;
    }

    try {
      setSubmitting(true);
      
      await api.put(`/api/goals/${goalId}`, {
        title,
        description: description || undefined,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || '0'),
        targetDate,
        isExpense,
        category: category || undefined
      });
      
      Alert.alert('Sucesso', 'Meta atualizada com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a meta. Tente novamente.');
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/goals/${goalId}`);
              Alert.alert('Sucesso', 'Meta excluída com sucesso!');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir meta:', error);
              Alert.alert('Erro', 'Não foi possível excluir a meta. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Carregando detalhes da meta...</Text>
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
        <TouchableOpacity onPress={handleDeleteGoal}>
          <Ionicons name={"trash-outline" as any} size={24} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Título</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Comprar um carro"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Descrição (Opcional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detalhes sobre sua meta..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Valor Alvo</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Valor Atual</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={currentAmount}
              onChangeText={setCurrentAmount}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Data Alvo</Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.text }}>{formatDate(targetDate)}</Text>
              <Ionicons name={"calendar-outline" as any} size={20} color={colors.primary} />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={targetDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Categoria (Opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={category}
              onChangeText={setCategory}
              placeholder="Ex: Investimento, Viagem..."
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>É uma despesa?</Text>
            <Switch
              value={isExpense}
              onValueChange={setIsExpense}
              trackColor={{ false: '#767577', true: colors.primary + '70' }}
              thumbColor={isExpense ? colors.primary : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdateGoal}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  textArea: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  dateButton: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditGoal;