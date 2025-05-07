// src/screens/PrevisaoFinanceira.tsx
import React, { useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

interface PrevisaoItem {
  adjustmentDescription: ReactNode;
  date: string;
  totalIncome: number;
  totalExpense: number;
  monthlyBalance: number;
  accumulatedBalance: number;
  incomeBreakdown: { [key: string]: number };
  expenseBreakdown: { [key: string]: number };
  fixedIncome: number;
  variableIncome: number;
  fixedExpense: number;
  variableExpense: number;
}

interface ManualAdjustment {
  month: number;
  year: number;
  income: number;
  expense: number;
  description: string;
}

const PrevisaoFinanceira = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  
  const [forecast, setForecast] = useState<PrevisaoItem[]>([]);
  const [months, setMonths] = useState<number>(6);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'expense' | 'accumulated'>('balance');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [showModal, setShowModal] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [manualAdjustments, setManualAdjustments] = useState<ManualAdjustment[]>([]);
  
  // Estado para ajustes manuais temporários
  const [adjustIncome, setAdjustIncome] = useState('');
  const [adjustExpense, setAdjustExpense] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');

  useEffect(() => {
    fetchForecast();
  }, [months]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/forecast?months=${months}`);
      setForecast(res.data.forecast);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar previsão:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados de previsão financeira.');
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const applyManualAdjustments = (originalForecast: PrevisaoItem[]): PrevisaoItem[] => {
    if (manualAdjustments.length === 0) return originalForecast;
    
    return originalForecast.map((item, index) => {
      const date = new Date(item.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const adjustment = manualAdjustments.find(
        adj => adj.month === month && adj.year === year
      );
      
      if (adjustment) {
        const newTotalIncome = item.totalIncome + adjustment.income;
        const newTotalExpense = item.totalExpense + adjustment.expense;
        const newMonthlyBalance = newTotalIncome - newTotalExpense;
        
        // Recalcular os saldos acumulados a partir deste mês
        let newAccumulatedBalance = index === 0 
          ? newMonthlyBalance 
          : originalForecast[index - 1].accumulatedBalance + newMonthlyBalance;
        
        return {
          ...item,
          totalIncome: newTotalIncome,
          totalExpense: newTotalExpense,
          monthlyBalance: newMonthlyBalance,
          accumulatedBalance: newAccumulatedBalance,
          // Incluir informação sobre o ajuste
          adjustmentDescription: adjustment.description
        };
      }
      
      // Se não houver ajuste, recalcular o saldo acumulado se necessário
      if (index > 0 && manualAdjustments.some(
        adj => {
          const prevDate = new Date(originalForecast[index - 1].date);
          return adj.month === prevDate.getMonth() && adj.year === prevDate.getFullYear();
        }
      )) {
        return {
          ...item,
          accumulatedBalance: originalForecast[index - 1].accumulatedBalance + item.monthlyBalance
        };
      }
      
      return item;
    });
  };

  const getAdjustedForecast = () => {
    return applyManualAdjustments(forecast);
  };

  const handleAddAdjustment = () => {
    if (selectedMonthIndex === null) return;
    
    const parsedIncome = parseFloat(adjustIncome) || 0;
    const parsedExpense = parseFloat(adjustExpense) || 0;
    
    if (parsedIncome === 0 && parsedExpense === 0) {
      Alert.alert('Aviso', 'Por favor, insira pelo menos um valor diferente de zero.');
      return;
    }
    
    const selectedMonth = forecast[selectedMonthIndex];
    const date = new Date(selectedMonth.date);
    
    const newAdjustment: ManualAdjustment = {
      month: date.getMonth(),
      year: date.getFullYear(),
      income: parsedIncome,
      expense: parsedExpense,
      description: adjustDescription || `Ajuste manual`
    };
    
    // Verificar se já existe um ajuste para este mês e substituir
    const existingIndex = manualAdjustments.findIndex(
      adj => adj.month === date.getMonth() && adj.year === date.getFullYear()
    );
    
    if (existingIndex >= 0) {
      const updatedAdjustments = [...manualAdjustments];
      updatedAdjustments[existingIndex] = newAdjustment;
      setManualAdjustments(updatedAdjustments);
    } else {
      setManualAdjustments([...manualAdjustments, newAdjustment]);
    }
    
    // Limpar campos e fechar modal
    setAdjustIncome('');
    setAdjustExpense('');
    setAdjustDescription('');
    setShowModal(false);
  };

  const getChartData = () => {
    const adjustedForecast = getAdjustedForecast();
    if (!adjustedForecast.length) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = adjustedForecast.map(item => {
      const date = new Date(item.date);
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[date.getMonth()]}`;
    });
    
    let data: number[] = [];
    let color: string;
    
    switch (activeTab) {
      case 'balance':
        data = adjustedForecast.map(item => item.monthlyBalance);
        color = colors.primary;
        break;
      case 'income':
        data = adjustedForecast.map(item => item.totalIncome);
        color = colors.success;
        break;
      case 'expense':
        data = adjustedForecast.map(item => item.totalExpense);
        color = colors.danger;
        break;
      case 'accumulated':
        data = adjustedForecast.map(item => item.accumulatedBalance);
        color = data[data.length - 1] >= 0 ? colors.success : colors.danger;
        break;
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.length ? data : [0],
          color: (opacity = 1) => {
            if (activeTab === 'balance' || activeTab === 'accumulated') {
              return data[data.length - 1] >= 0 ? colors.success : colors.danger;
            }
            return activeTab === 'income' ? colors.success : colors.danger;
          },
          strokeWidth: 2
        }
      ],
      legend: [
        `${
          activeTab === 'balance' ? 'Saldo Mensal' : 
          activeTab === 'income' ? 'Receitas' : 
          activeTab === 'expense' ? 'Despesas' : 
          'Saldo Acumulado'
        }`
      ]
    };
  };

  const getFixedVsVariableData = (selectedIndex: number) => {
    if (!forecast.length || selectedIndex >= forecast.length) return null;
    
    const item = forecast[selectedIndex];
    
    return {
      labels: ["Fixo", "Variável"],
      datasets: [
        {
          data: [item.fixedIncome, item.variableIncome],
          color: () => colors.success
        },
        {
          data: [item.fixedExpense, item.variableExpense],
          color: () => colors.danger
        }
      ],
      legend: ["Receitas", "Despesas"]
    };
  };

  const getBreakdownData = (item: PrevisaoItem, type: 'income' | 'expense') => {
    const breakdown = type === 'income' ? item.incomeBreakdown : item.expenseBreakdown;
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1]) // Ordenar por valor decrescente
      .map(([category, value]) => ({
        category,
        value,
        percentage: (value / (type === 'income' ? item.totalIncome : item.totalExpense)) * 100
      }));
  };

  const renderAdjustmentModal = () => {
    if (selectedMonthIndex === null || !forecast[selectedMonthIndex]) return null;
    
    const selectedMonth = forecast[selectedMonthIndex];
    const date = new Date(selectedMonth.date);
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Verificar se já existe um ajuste para este mês
    const existingAdjustment = manualAdjustments.find(
      adj => adj.month === date.getMonth() && adj.year === date.getFullYear()
    );
    
    if (existingAdjustment) {
      setAdjustIncome(existingAdjustment.income.toString());
      setAdjustExpense(existingAdjustment.expense.toString());
      setAdjustDescription(existingAdjustment.description);
    }
    
    return (
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Ajustar {monthNames[date.getMonth()]} {date.getFullYear()}
            </Text>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Ajuste de Receita (+ ou -)
            </Text>
            <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>R$</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                value={adjustIncome}
                onChangeText={setAdjustIncome}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Ajuste de Despesa (+ ou -)
            </Text>
            <View style={[styles.modalInputContainer, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary }}>R$</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text }]}
                value={adjustExpense}
                onChangeText={setAdjustExpense}
                keyboardType="numeric"
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>
              Descrição do Ajuste
            </Text>
            <TextInput
              style={[styles.modalDescription, { color: colors.text, borderColor: colors.border }]}
              value={adjustDescription}
              onChangeText={setAdjustDescription}
              placeholder="Ex: Bônus esperado, Viagem planejada..."
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { borderColor: colors.border }]} 
                onPress={() => {
                  setAdjustIncome('');
                  setAdjustExpense('');
                  setAdjustDescription('');
                  setShowModal(false);
                }}
              >
                <Text style={{ color: colors.text }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                onPress={handleAddAdjustment}
              >
                <Text style={{ color: '#fff' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Previsão Financeira</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[
            styles.periodButton, 
            months === 3 && { backgroundColor: colors.primary }
          ]}
          onPress={() => setMonths(3)}
        >
          <Text style={{ 
            color: months === 3 ? '#fff' : colors.textSecondary,
          }}>3 Meses</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.periodButton, 
            months === 6 && { backgroundColor: colors.primary }
          ]}
          onPress={() => setMonths(6)}
        >
          <Text style={{ 
            color: months === 6 ? '#fff' : colors.textSecondary,
          }}>6 Meses</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.periodButton, 
            months === 12 && { backgroundColor: colors.primary }
          ]}
          onPress={() => setMonths(12)}
        >
          <Text style={{ 
            color: months === 12 ? '#fff' : colors.textSecondary,
          }}>12 Meses</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartTabs}>
        <TouchableOpacity 
          style={[
            styles.chartTab, 
            activeTab === 'balance' && { ...styles.activeTab, backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setActiveTab('balance')}
        >
          <Text style={[
            styles.chartTabText, 
            { color: activeTab === 'balance' ? colors.primary : colors.textSecondary }
          ]}>Mensal</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.chartTab, 
            activeTab === 'accumulated' && { ...styles.activeTab, backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setActiveTab('accumulated')}
        >
          <Text style={[
            styles.chartTabText, 
            { color: activeTab === 'accumulated' ? colors.primary : colors.textSecondary }
          ]}>Acumulado</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.chartTab, 
            activeTab === 'income' && { ...styles.activeTab, backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[
            styles.chartTabText, 
            { color: activeTab === 'income' ? colors.success : colors.textSecondary }
          ]}>Receitas</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.chartTab, 
            activeTab === 'expense' && { ...styles.activeTab, backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[
            styles.chartTabText, 
            { color: activeTab === 'expense' ? colors.danger : colors.textSecondary }
          ]}>Despesas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartTypeSelector}>
        <TouchableOpacity 
          style={[
            styles.chartTypeButton, 
            chartType === 'line' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setChartType('line')}
        >
          <Ionicons 
            name={"analytics-outline" as any} 
            size={16} 
            color={chartType === 'line' ? '#fff' : colors.textSecondary} 
          />
          <Text style={{ 
            color: chartType === 'line' ? '#fff' : colors.textSecondary,
            marginLeft: 5,
            fontSize: 12
          }}>Linha</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.chartTypeButton, 
            chartType === 'bar' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setChartType('bar')}
        >
          <Ionicons 
            name={"bar-chart-outline" as any} 
            size={16} 
            color={chartType === 'bar' ? '#fff' : colors.textSecondary} 
          />
          <Text style={{ 
            color: chartType === 'bar' ? '#fff' : colors.textSecondary,
            marginLeft: 5,
            fontSize: 12
          }}>Barra</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando dados...</Text>
        </View>
      ) : forecast.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name={"calculator-outline" as any} size={60} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Sem dados de previsão disponíveis
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Adicione transações para ver uma previsão financeira
          </Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.chartContainer}>
            {chartType === 'line' ? (
              <LineChart
                data={getChartData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => isDark ? '#fff' : '#333',
                  labelColor: (opacity = 1) => colors.text,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: activeTab === 'income' ? colors.success : 
                            activeTab === 'expense' ? colors.danger : colors.primary
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            ) : (
              <BarChart
                data={getChartData()}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => {
                    if (activeTab === 'balance' || activeTab === 'accumulated') {
                      return getChartData().datasets[0].data[getChartData().datasets[0].data.length - 1] >= 0
                        ? colors.success
                        : colors.danger;
                    }
                    return activeTab === 'income' ? colors.success : colors.danger;
                  },
                  labelColor: (opacity = 1) => colors.text,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                fromZero 
                yAxisLabel={''} 
                yAxisSuffix={''}
              />
            )}
          </View>

          <View style={[styles.forecastListContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.forecastListTitle, { color: colors.text }]}>
              Análise Mensal Detalhada
            </Text>
            
            {getAdjustedForecast().map((item, index) => {
              const date = new Date(item.date);
              const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
              
              // Verificar se há ajuste manual para este mês
              const hasAdjustment = manualAdjustments.some(
                adj => adj.month === date.getMonth() && adj.year === date.getFullYear()
              );
              
              return (
                <View 
                  key={index} 
                  style={[
                    styles.forecastItem, 
                    { backgroundColor: colors.card, borderColor: colors.border },
                    index === forecast.length - 1 && { marginBottom: 20 }
                  ]}
                >
                  <View style={styles.forecastMonthHeader}>
                    <Text style={[styles.forecastMonth, { color: colors.text }]}>
                      {monthNames[date.getMonth()]} {date.getFullYear()}
                    </Text>
                    
                    <TouchableOpacity
                      style={[styles.adjustButton, { backgroundColor: hasAdjustment ? colors.primary + '40' : 'transparent' }]}
                      onPress={() => {
                        setSelectedMonthIndex(index);
                        setShowModal(true);
                      }}
                    >
                      <Ionicons 
                        name={"pencil" as any} 
                        size={16} 
                        color={hasAdjustment ? colors.primary : colors.textSecondary} 
                      />
                      <Text style={{ 
                        color: hasAdjustment ? colors.primary : colors.textSecondary,
                        fontSize: 12,
                        marginLeft: 5
                      }}>
                        {hasAdjustment ? 'Ajustado' : 'Ajustar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {item.adjustmentDescription && (
                    <View style={[styles.adjustmentNote, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={{ color: colors.primary, fontSize: 12 }}>
                        <Ionicons name={"information-circle" as any} size={12} color={colors.primary} /> 
                        {' '}Ajuste: {item.adjustmentDescription}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.forecastOverview}>
                    <View style={styles.forecastStat}>
                      <Text style={[styles.forecastStatLabel, { color: colors.textSecondary }]}>
                        Receitas
                      </Text>
                      <Text style={[styles.forecastStatValue, { color: colors.success }]}>
                        {formatCurrency(item.totalIncome)}
                      </Text>
                    </View>
                    
                    <View style={styles.forecastStat}>
                      <Text style={[styles.forecastStatLabel, { color: colors.textSecondary }]}>
                        Despesas
                      </Text>
                      <Text style={[styles.forecastStatValue, { color: colors.danger }]}>
                        {formatCurrency(item.totalExpense)}
                      </Text>
                    </View>
                    
                    <View style={styles.forecastStat}>
                      <Text style={[styles.forecastStatLabel, { color: colors.textSecondary }]}>
                        Saldo
                      </Text>
                      <Text style={[styles.forecastStatValue, { 
                        color: item.monthlyBalance >= 0 ? colors.success : colors.danger 
                      }]}>
                        {formatCurrency(item.monthlyBalance)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fixedVsVariableContainer}>
                    <Text style={[styles.breakdownTitle, { color: colors.text }]}>
                      Fixo vs. Variável
                    </Text>
                    <View style={styles.fixedVsVariableGrid}>
                      <View style={styles.fixedVsVariableColumn}>
                        <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                          Receitas Fixas
                        </Text>
                        <Text style={[styles.fixedVsVariableValue, { color: colors.success }]}>
                          {formatCurrency(item.fixedIncome)}
                        </Text>
                        <Text style={[styles.fixedVsVariablePercentage, { color: colors.textSecondary }]}>
                          {(item.fixedIncome / item.totalIncome * 100).toFixed(0)}%
                        </Text>
                      </View>

                      <View style={styles.fixedVsVariableColumn}>
                        <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                          Receitas Variáveis
                        </Text>
                        <Text style={[styles.fixedVsVariableValue, { color: colors.success }]}>
                          {formatCurrency(item.variableIncome)}
                        </Text>
                        <Text style={[styles.fixedVsVariablePercentage, { color: colors.textSecondary }]}>
                          {(item.variableIncome / item.totalIncome * 100).toFixed(0)}%
                        </Text>
                      </View>

                      <View style={styles.fixedVsVariableColumn}>
                        <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                          Despesas Fixas
                        </Text>
                        <Text style={[styles.fixedVsVariableValue, { color: colors.danger }]}>
                          {formatCurrency(item.fixedExpense)}
                        </Text>
                        <Text style={[styles.fixedVsVariablePercentage, { color: colors.textSecondary }]}>
                          {(item.fixedExpense / item.totalExpense * 100).toFixed(0)}%
                        </Text>
                      </View>

                      <View style={styles.fixedVsVariableColumn}>
                        <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                          Despesas Variáveis
                        </Text>
                        <Text style={[styles.fixedVsVariableValue, { color: colors.danger }]}>
                          {formatCurrency(item.variableExpense)}
                        </Text>
                        <Text style={[styles.fixedVsVariablePercentage, { color: colors.textSecondary }]}>
                          {(item.variableExpense / item.totalExpense * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.breakdownContainer}>
                    <View style={styles.breakdownSection}>
                      <Text style={[styles.breakdownTitle, { color: colors.text }]}>
                        Principais Receitas
                      </Text>
                      {getBreakdownData(item, 'income').slice(0, 3).length > 0 ? (
                        getBreakdownData(item, 'income').slice(0, 3).map((breakdown, idx) => (
                          <View key={idx} style={styles.breakdownItem}>
                            <View style={styles.breakdownCategory}>
                              <Text style={[styles.breakdownCategoryText, { color: colors.text }]} numberOfLines={1}>
                                {breakdown.category}
                              </Text>
                              <Text style={[styles.breakdownPercentage, { color: colors.textSecondary }]}>
                                {breakdown.percentage.toFixed(0)}%
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${breakdown.percentage}%`, 
                                    backgroundColor: colors.success 
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={[styles.breakdownValue, { color: colors.success }]}>
                              {formatCurrency(breakdown.value)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                          Sem dados de receitas
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.breakdownSection}>
                      <Text style={[styles.breakdownTitle, { color: colors.text }]}>
                        Principais Despesas
                      </Text>
                      {getBreakdownData(item, 'expense').slice(0, 3).length > 0 ? (
                        getBreakdownData(item, 'expense').slice(0, 3).map((breakdown, idx) => (
                          <View key={idx} style={styles.breakdownItem}>
                            <View style={styles.breakdownCategory}>
                              <Text style={[styles.breakdownCategoryText, { color: colors.text }]} numberOfLines={1}>
                                {breakdown.category}
                              </Text>
                              <Text style={[styles.breakdownPercentage, { color: colors.textSecondary }]}>
                                {breakdown.percentage.toFixed(0)}%
                              </Text>
                            </View>
                            <View style={styles.breakdownBarContainer}>
                              <View 
                                style={[
                                  styles.breakdownBar, 
                                  { 
                                    width: `${breakdown.percentage}%`, 
                                    backgroundColor: colors.danger 
                                  }
                                ]} 
                              />
                            </View>
                            <Text style={[styles.breakdownValue, { color: colors.danger }]}>
                              {formatCurrency(breakdown.value)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
                          Sem dados de despesas
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.accumulatedContainer}>
                    <Text style={[styles.accumulatedLabel, { color: colors.textSecondary }]}>
                      Saldo Acumulado
                    </Text>
                    <Text style={[styles.accumulatedValue, { 
                      color: item.accumulatedBalance >= 0 ? colors.success : colors.danger 
                    }]}>
                      {formatCurrency(item.accumulatedBalance)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
      
      {renderAdjustmentModal()}
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
  },
  chartTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  chartTab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    fontWeight: 'bold',
  },
  chartTabText: {
    fontWeight: '600',
    fontSize: 12,
  },
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 8,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  forecastListContainer: {
    paddingHorizontal: 20,
  },
  forecastListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  forecastItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  forecastMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forecastMonth: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  adjustmentNote: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  forecastOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  forecastStat: {
    alignItems: 'center',
  },
  forecastStatLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  forecastStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fixedVsVariableContainer: {
    marginBottom: 16,
  },
  fixedVsVariableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  fixedVsVariableColumn: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  fixedVsVariableLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  fixedVsVariableValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fixedVsVariablePercentage: {
    fontSize: 12,
  },
  breakdownContainer: {
    marginBottom: 16,
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  breakdownItem: {
    marginBottom: 8,
  },
  breakdownCategory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownCategoryText: {
    fontSize: 12,
    flex: 1,
  },
  breakdownPercentage: {
    fontSize: 12,
    marginLeft: 8,
  },
  breakdownBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  breakdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  noDataText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  accumulatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  accumulatedLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  accumulatedValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingVertical: 8,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 5,
  },
});

export default PrevisaoFinanceira;