// src/screens/PrevisaoFinanceira.tsx
import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

// Versão ultra simplificada - sem qualquer biblioteca de gráficos

interface PrevisaoItem {
  date: string;
  totalIncome: number;
  totalExpense: number;
  monthlyBalance: number;
  accumulatedBalance: number;
  fixedIncome: number;
  variableIncome: number;
  fixedExpense: number;
  variableExpense: number;
}

const PrevisaoFinanceira = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  const [forecast, setForecast] = useState<PrevisaoItem[]>([]);
  const [months, setMonths] = useState<number>(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecast();
  }, [months]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await api.get(`/api/forecast?months=${months}`);
      
      if (!res.data || !res.data.forecast || !Array.isArray(res.data.forecast)) {
        setError('Formato de dados inválido recebido do servidor');
        setForecast([]);
      } else {
        setForecast(res.data.forecast);
      }
    } catch (error) {
      console.error('Erro ao buscar previsão:', error);
      setError('Não foi possível carregar os dados de previsão financeira.');
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Carregando dados...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name={"alert-circle-outline" as any} size={48} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchForecast}
          >
            <Text style={{ color: '#fff' }}>Tentar Novamente</Text>
          </TouchableOpacity>
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
        <ScrollView style={styles.content}>
          <View style={styles.infoBox}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              Versão simplificada da previsão financeira sem gráficos - apenas dados
            </Text>
          </View>

          <View style={[styles.forecastListContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.forecastListTitle, { color: colors.text }]}>
              Análise Mensal Detalhada
            </Text>
            
            {forecast.map((item, index) => {
              try {
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
                        </View>

                        <View style={styles.fixedVsVariableColumn}>
                          <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                            Receitas Variáveis
                          </Text>
                          <Text style={[styles.fixedVsVariableValue, { color: colors.success }]}>
                            {formatCurrency(item.variableIncome)}
                          </Text>
                        </View>

                        <View style={styles.fixedVsVariableColumn}>
                          <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                            Despesas Fixas
                          </Text>
                          <Text style={[styles.fixedVsVariableValue, { color: colors.danger }]}>
                            {formatCurrency(item.fixedExpense)}
                          </Text>
                        </View>

                        <View style={styles.fixedVsVariableColumn}>
                          <Text style={[styles.fixedVsVariableLabel, { color: colors.textSecondary }]}>
                            Despesas Variáveis
                          </Text>
                          <Text style={[styles.fixedVsVariableValue, { color: colors.danger }]}>
                            {formatCurrency(item.variableExpense)}
                          </Text>
                        </View>
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
              } catch (e) {
                console.error("Erro ao renderizar item de previsão:", e, index);
                return (
                  <View key={index} style={[styles.forecastItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={{ color: colors.danger }}>Erro ao carregar dados deste mês</Text>
                  </View>
                );
              }
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
    marginBottom: 10,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
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
  content: {
    flex: 1,
  },
  infoBox: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
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
    marginBottom: 10,
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
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
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
  }
});

export default PrevisaoFinanceira;