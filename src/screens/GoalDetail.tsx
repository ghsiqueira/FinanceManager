// src/screens/GoalDetail.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Goal } from '../types';
import { RootStackParamList } from '../types/navigation';
import api from '../services/api';

type GoalDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'GoalDetail'>;
type GoalDetailScreenRouteProp = RouteProp<RootStackParamList, 'GoalDetail'>;

const GoalDetail = () => {
  const navigation = useNavigation<GoalDetailScreenNavigationProp>();
  const route = useRoute<GoalDetailScreenRouteProp>();
  const { colors } = useTheme();
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateAmount, setUpdateAmount] = useState('');
  const [updateType, setUpdateType] = useState<'add' | 'set'>('add');
  
  const { goalId } = route.params;

  const fetchGoal = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/goals/${goalId}`);
      setGoal(res.data);
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da meta.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const calculateProgress = (currentAmount: number, targetAmount: number) => {
    return Math.min(Math.max((currentAmount / targetAmount) * 100, 0), 100);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const calculateMonthlyAmount = () => {
    if (!goal) return 0;
    
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    
    // Calcular meses entre hoje e a data alvo
    const months = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
      (targetDate.getMonth() - today.getMonth());
    
    if (months <= 0) return 0;
    
    // Calcular valor mensal necessário
    const remaining = goal.targetAmount - goal.currentAmount;
    return remaining / months;
  };

  const calculateDaysRemaining = () => {
    if (!goal) return 0;
    
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const handleUpdateAmount = async () => {
    if (!goal) return;
    
    const parsedAmount = parseFloat(updateAmount.replace(',', '.'));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Erro', 'Insira um valor válido');
      return;
    }
    
    try {
      let newAmount = 0;
      
      if (updateType === 'add') {
        newAmount = goal.currentAmount + parsedAmount;
      } else { // set
        newAmount = parsedAmount;
      }
      
      // Garantir que o valor não ultrapasse a meta
      if (!goal.isExpense && newAmount > goal.targetAmount) {
        newAmount = goal.targetAmount;
      }
      
      await api.put(`/api/goals/${goalId}`, {
        currentAmount: newAmount
      });
      
      setShowUpdateModal(false);
      setUpdateAmount('');
      fetchGoal();
      
      Alert.alert('Sucesso', 'Valor atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o valor.');
    }
  };

  const handleDeleteGoal = () => {
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
              Alert.alert('Sucesso', 'Meta excluída com sucesso!');
              navigation.goBack();
            } catch (error) {
              console.error('Erro ao excluir meta:', error);
              Alert.alert('Erro', 'Não foi possível excluir a meta.');
            }
          }
        }
      ]
    );
  };

  if (loading || !goal) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes da Meta</Text>
          <TouchableOpacity onPress={handleDeleteGoal}>
            <Ionicons 
              name={"trash-outline" as any} 
              size={24} 
              color={colors.danger} 
            />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
  const monthlyAmount = calculateMonthlyAmount();
  const daysRemaining = calculateDaysRemaining();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detalhes da Meta</Text>
        <TouchableOpacity onPress={handleDeleteGoal}>
          <Ionicons 
            name={"trash-outline" as any} 
            size={24} 
            color={colors.danger} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
          
          {goal.category && (
            <View style={[styles.categoryTag, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {goal.category}
              </Text>
            </View>
          )}
          
          {goal.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {goal.description}
            </Text>
          )}
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Progresso</Text>
          
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { backgroundColor: colors.border }
              ]}
            >
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress}%`, 
                    backgroundColor: goal.isExpense ? colors.warning : colors.success
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {progress.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.amountRow}>
            <View>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                {goal.isExpense ? 'Valor Planejado' : 'Meta'}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                {goal.isExpense ? 'Valor Reservado' : 'Poupado'}
              </Text>
              <Text style={[styles.amount, { color: colors.text }]}>
                {formatCurrency(goal.currentAmount)}
              </Text>
            </View>
          </View>
          
          <View style={[styles.updateButton, { backgroundColor: colors.primary }]}>
            <TouchableOpacity 
              onPress={() => {
                setUpdateType('add');
                setShowUpdateModal(true);
              }}
              style={styles.updateButtonTouchable}
            >
              <Text style={styles.updateButtonText}>
                {goal.isExpense ? 'Reservar Valor' : 'Adicionar Poupança'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detalhes</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Data Alvo</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(goal.targetDate)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Dias Restantes</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {daysRemaining} dias
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tipo de Meta</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {goal.isExpense ? 'Gasto Planejado' : 'Meta de Economia'}
            </Text>
          </View>
          
          {monthlyAmount > 0 && (
            <View style={[styles.monthlyContainer, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.monthlyText, { color: colors.primary }]}>
                Para atingir esta meta até {formatDate(goal.targetDate)}, você precisa 
                {goal.isExpense ? ' reservar ' : ' poupar '}
                {formatCurrency(monthlyAmount)} por mês.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Modal para atualizar valor */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {updateType === 'add' 
                ? (goal.isExpense ? 'Reservar Valor' : 'Adicionar Poupança') 
                : 'Definir Valor Atual'}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[
                  styles.typeButton, 
                  updateType === 'add' && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setUpdateType('add')}
              >
                <Text style={{ color: updateType === 'add' ? '#fff' : colors.text }}>Adicionar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.typeButton, 
                  updateType === 'set' && { backgroundColor: colors.primary },
                  { borderColor: colors.border }
                ]}
                onPress={() => setUpdateType('set')}
              >
                <Text style={{ color: updateType === 'set' ? '#fff' : colors.text }}>Definir Total</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.amountInputContainer, { borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>R$</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary + '80'}
                keyboardType="decimal-pad"
                value={updateAmount}
                onChangeText={setUpdateAmount}
                autoFocus
              />
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowUpdateModal(false)}
              >
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateAmount}
              >
                <Text style={{ color: '#fff' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  updateButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  updateButtonTouchable: {
    padding: 14,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthlyContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  monthlyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
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
  modalButtons: {
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
});

export default GoalDetail;