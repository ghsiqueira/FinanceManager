// src/screens/PrevisaoFinanceira.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const screenWidth = Dimensions.get('window').width;

interface PrevisaoItem {
  date: string;
  totalIncome: number;
  totalExpense: number;
  monthlyBalance: number;
  accumulatedBalance: number;
  incomeBreakdown: { [key: string]: number };
  expenseBreakdown: { [key: string]: number };
}

const PrevisaoFinanceira = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  
  const [forecast, setForecast] = useState<PrevisaoItem[]>([]);
  const [months, setMonths] = useState<number>(6);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'expense'>('balance');

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

  const getChartData = () => {
    if (!forecast.length) return { labels: [], datasets: [{ data: [] }] };
    
    const labels = forecast.map(item => {
      const date = new Date(item.date);
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${monthNames[date.getMonth()]}`;
    });
    
    let data: number[] = [];
    
    switch (activeTab) {
      case 'balance':
        data = forecast.map(item => item.monthlyBalance);
        break;
      case 'income':
        data = forecast.map(item => item.totalIncome);
        break;
      case 'expense':
        data = forecast.map(item => item.totalExpense);
        break;
    }
    
    return {
      labels,
      datasets: [
        {
          data: data.length ? data : [0],
          color: (opacity = 1) => 
            activeTab === 'balance' 
              ? data[data.length - 1] >= 0 
                ? colors.success 
                : colors.danger
              : activeTab === 'income' 
                ? colors.success 
                : colors.danger,
          strokeWidth: 2
        }
      ],
      legend: [`${activeTab === 'balance' ? 'Saldo' : activeTab === 'income' ? 'Receitas' : 'Despesas'}`]
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
          ]}>Saldo</Text>
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
                  stroke: activeTab === 'balance' ? colors.primary : 
                           activeTab === 'income' ? colors.success : colors.danger
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>

          <View style={[styles.forecastListContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.forecastListTitle, { color: colors.text }]}>
              Análise Mensal Detalhada
            </Text>
            
            {forecast.map((item, index) => {
              const date = new Date(item.date);
              const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
              return (
                <View 
                  key={index} 
                  style={[
                    styles.forecastItem, 
                    { backgroundColor: colors.card, borderColor: colors.border },
                    index === forecast.length - 1 && { marginBottom: 20 }
                  ]}
                >
                  <Text style={[styles.forecastMonth, { color: colors.text }]}>
                    {monthNames[date.getMonth()]} {date.getFullYear()}
                  </Text>
                  
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  chartTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTab: {
    fontWeight: 'bold',
  },
  chartTabText: {
    fontWeight: '600',
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
  forecastMonth: {
    fontSize: 18,
    fontWeight: 'bold',
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
});

export default PrevisaoFinanceira;