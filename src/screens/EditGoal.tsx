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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { RootStackParamList } from '../types/navigation';

type EditGoalRouteProp = RouteProp<RootStackParamList, 'EditGoal'>;

interface GoalHistoryItem {
  date: Date;
  amount: number;
  type: 'deposit' | 'withdraw';
  description?: string;
}

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
  const [history, setHistory] = useState<GoalHistoryItem[]>([]);
  
  // Estado para modal de adição de transação
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [transactionDescription, setTransactionDescription] = useState('');

  // Estados de progresso visual
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [timeProgress, setTimeProgress] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);

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
      
      // Buscar histórico de transações
      const historyRes = await api.get(`/api/goals/${goalId}/history`);
      setHistory(historyRes.data || []);
      
      // Calcular progresso
      calculateProgress(goal.currentAmount, goal.targetAmount, new Date(goal.targetDate));
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar detalhes da meta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da meta.');
      navigation.goBack();
    }
  };

  const calculateProgress = (current: number, target: number, endDate: Date) => {
    // Calcular progresso do valor
    const percentage = Math.min(Math.max((current / target) * 100, 0), 100);
    setProgressPercentage(percentage);
    
    // Calcular progresso do tempo
    const today = new Date();
    const startDate = new Date(history.length > 0 ? history[0].date : today);
    startDate.setHours(0, 0, 0, 0);
    
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysToTarget = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    setTimeProgress(Math.min(100, (daysElapsed / totalDays) * 100));
    setDaysRemaining(daysToTarget);
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

  const handleAddTransaction = async () => {
    if (!transactionAmount || parseFloat(transactionAmount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido.');
      return;
    }

    try {
      const amount = parseFloat(transactionAmount.replace(',', '.'));
      
      await api.post(`/api/goals/${goalId}/transaction`, {
        amount,
        type: transactionType,
        description: transactionDescription || undefined
      });
      
      // Atualizar o valor atual
      const newCurrentAmount = transactionType === 'deposit' 
        ? parseFloat(currentAmount) + amount
        : Math.max(0, parseFloat(currentAmount) - amount);
      
      setCurrentAmount(newCurrentAmount.toString());
      
      // Adicionar à história local temporariamente
      const newHistoryItem: GoalHistoryItem = {
        date: new Date(),
        amount,
        type: transactionType,
        description: transactionDescription
      };
      
      setHistory([...history, newHistoryItem]);
      
      // Recalcular progresso
      calculateProgress(newCurrentAmount, parseFloat(targetAmount), targetDate);
      
      // Fechar modal e limpar campos
      setTransactionAmount('');
      setTransactionDescription('');
      setShowTransactionModal(false);
      
      Alert.alert('Sucesso', 'Transação adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a transação.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const getMonthlyAmount = () => {
    const today = new Date();
    const monthsLeft = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    
    if (monthsLeft <= 0) return 0;
    
    const remaining = parseFloat(targetAmount) - parseFloat(currentAmount);
    return remaining / monthsLeft;
  };

  const renderTransactionModal = () => {
    return (
      <Modal
        visible={showTransactionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isExpense ? 'Atualizar Valor Reservado' : 'Atualizar Meta'}
            </Text>
            
            <View style={styles.transactionTypeSelector}>
              <TouchableOpacity 
                style={[
                  styles.typeButton, 
                  transactionType === 'deposit' && { backgroundColor: colors.success },
                  { borderColor: colors.border }
                ]}
                onPress={() => setTransactionType('deposit')}
              >
                <Text style={{ color: transactionType === 'deposit' ? '#fff' : colors.text }}>
                  {isExpense ? 'Reservar' : 'Depositar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.typeButton, 
                  transactionType === 'withdraw' && { backgroundColor: colors.danger },
                  { borderColor: colors.border }
                ]}
                onPress={() => setTransactionType('withdraw')}
              >
                <Text style={{ color: transactionType === 'withdraw' ? '#fff' : colors.text }}>
                  {isExpense ? 'Desfazer Reserva' : 'Retirar'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Valor
            </Text>
            <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>R$</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                value={transactionAmount}
                onChangeText={setTransactionAmount}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Descrição (opcional)
            </Text>
            <TextInput
              style={[styles.modalDescription, { color: colors.text, borderColor: colors.border }]}
              value={transactionDescription}
              onChangeText={setTransactionDescription}
              placeholder="Ex: Recebi salário, Retirei para emergência..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: colors.border }]} 
                onPress={() => setShowTransactionModal(false)}
              >
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                onPress={handleAddTransaction}
              >
                <Text style={{ color: '#fff' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.progressTitle, { color: colors.text }]}>Progresso da Meta</Text>
            
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={{ color: colors.textSecondary }}>Valor Atual</Text>
                <Text style={{ color: colors.textSecondary }}>
                  {progressPercentage.toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: isExpense ? colors.warning : colors.success
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressValues}>
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                  {formatCurrency(parseFloat(currentAmount) || 0)}
                </Text>
                <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                  {formatCurrency(parseFloat(targetAmount) || 0)}
                </Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={{ color: colors.textSecondary }}>Tempo</Text>
                <Text style={{ color: colors.textSecondary }}>
                  {timeProgress.toFixed(0)}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${timeProgress}%`,
                      backgroundColor: colors.primary
                    }
                  ]} 
                />
              </View>
              <Text style={{ color: colors.text, marginTop: 4 }}>
                {daysRemaining} dias restantes (até {formatDate(targetDate)})
              </Text>
            </View>
            
            <View style={styles.progressActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowTransactionModal(true)}
              >
                <Text style={{ color: '#fff' }}>
                  {isExpense ? 'Atualizar Valor Reservado' : 'Atualizar Valor'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Título</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Viagem, Casa própria, Emergência"
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

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
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
              
              <View style={[styles.formGroup, { flex: 1 }]}>
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
                placeholder="Ex: Viagem, Educação, Aposentadoria..."
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Tipo de Meta</Text>
              <View style={styles.switchRow}>
                <Text style={{ color: colors.text, marginRight: 10 }}>
                  {isExpense ? 'Gasto Planejado' : 'Meta de Economia'}
                </Text>
                <Switch
                  value={isExpense}
                  onValueChange={setIsExpense}
                  trackColor={{ false: colors.success + '40', true: colors.warning + '40' }}
                  thumbColor={isExpense ? colors.warning : colors.success}
                />
              </View>
            </View>
            
            {getMonthlyAmount() > 0 && (
              <View style={[styles.infoCard, { backgroundColor: colors.primary + '20' }]}>
                <Text style={{ color: colors.primary }}>
                  Para atingir esta meta, você precisa {isExpense ? 'reservar' : 'economizar'} aproximadamente {formatCurrency(getMonthlyAmount())} por mês.
                </Text>
              </View>
            )}

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
          
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>Histórico de Transações</Text>
              
              {history.map((item, index) => (
                <View 
                  key={index} 
                  style={[styles.historyItem, { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border,
                    borderLeftColor: item.type === 'deposit' ? colors.success : colors.danger,
                    borderLeftWidth: 4
                  }]}
                >
                  <View style={styles.historyHeader}>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {formatDate(item.date)}
                    </Text>
                    <Text style={{ 
                      color: item.type === 'deposit' ? colors.success : colors.danger,
                      fontWeight: 'bold'
                    }}>
                      {item.type === 'deposit' ? '+' : '-'} {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  
                  {item.description && (
                    <Text style={{ color: colors.text, marginTop: 4 }}>
                      {item.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
        
        {renderTransactionModal()}
      </View>
    </KeyboardAvoidingView>
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
    progressCard: {
      margin: 20,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
    },
    progressTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    progressSection: {
      marginBottom: 16,
    },
    progressLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    progressBar: {
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    progressValues: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressActions: {
      marginTop: 8,
      alignItems: 'stretch',
    },
    actionButton: {
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    formContainer: {
      padding: 20,
    },
    formGroup: {
      marginBottom: 16,
    },
    formRow: {
      flexDirection: 'row',
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
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoCard: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
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
    historySection: {
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    historyItem: {
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 10,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '85%',
      borderRadius: 12,
      padding: 20,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    transactionTypeSelector: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    typeButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      marginHorizontal: 4,
      borderRadius: 8,
    },
    modalLabel: {
      fontSize: 14,
      marginBottom: 8,
    },
    modalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    modalInput: {
      flex: 1,
      paddingVertical: 10,
      paddingLeft: 10,
    },
    modalDescription: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        marginHorizontal: 5,
    },    
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    }, 
  });
  
export default EditGoal;