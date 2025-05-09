// src/components/TransactionItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, ColorTheme } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  colors: ColorTheme;
  onPress: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, colors, onPress }) => {
  // Função para formatar a data
  const formatDate = (date: Date | string) => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Função para formatar o valor monetário
  const formatCurrency = (value: number) => {
    try {
      return `R$ ${value.toFixed(2)}`;
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      return 'R$ 0,00';
    }
  };

  // Ícone e cor baseados na categoria - Com tratamento de erros
  const getCategoryIcon = (category: string) => {
    try {
      switch ((category || '').toLowerCase()) {
        case 'alimentação':
        case 'food':
          return { name: "restaurant", color: colors.danger };
        case 'transporte':
        case 'transport':
          return { name: "car", color: colors.info };
        case 'moradia':
        case 'housing':
          return { name: "home", color: colors.warning };
        case 'saúde':
        case 'health':
          return { name: "medical", color: colors.danger };
        case 'educação':
        case 'education':
          return { name: "school", color: colors.primary };
        case 'lazer':
        case 'leisure':
          return { name: "game-controller", color: colors.secondary };
        case 'salário':
        case 'salary':
          return { name: "cash", color: colors.success };
        case 'investimento':
        case 'investment':
          return { name: "trending-up", color: colors.info };
        default:
          return { name: "pricetag", color: colors.textSecondary };
      }
    } catch (error) {
      console.error('Erro ao definir ícone da categoria:', error);
      return { name: "help-circle", color: colors.textSecondary };
    }
  };

  // Verificação de segurança para o objeto de transação
  if (!transaction || typeof transaction !== 'object') {
    console.error('Transação inválida:', transaction);
    return (
      <View style={[styles.container, { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        opacity: 0.5
      }]}>
        <Text style={{ color: colors.danger }}>Erro: Dados inválidos</Text>
      </View>
    );
  }

  // Obter o ícone e a cor da categoria com segurança
  let iconInfo;
  try {
    iconInfo = getCategoryIcon(transaction.category || '');
  } catch (error) {
    console.error('Erro ao obter ícone:', error);
    iconInfo = { name: "help-circle", color: colors.textSecondary };
  }

  // Verificação de segurança para a função onPress
  const handlePress = () => {
    if (onPress && typeof onPress === 'function') {
      try {
        onPress();
      } catch (error) {
        console.error('Erro ao executar onPress:', error);
        Alert.alert('Erro', 'Ocorreu um erro ao processar esta operação.');
      }
    } else {
      console.error('TransactionItem - Função onPress não fornecida ou inválida');
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { 
        backgroundColor: `${iconInfo.color}20` 
      }]}>
        <Ionicons name={iconInfo.name as any} size={20} color={iconInfo.color} />
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <View style={styles.categoryContainer}>
            <Text style={[styles.category, { color: colors.text }]}>
              {transaction.category || 'Sem categoria'}
            </Text>
            {transaction.isFixed && (
              <View style={[styles.fixedBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.fixedText, { color: colors.primary }]}>Fixa</Text>
              </View>
            )}
          </View>
          <Text 
            style={[
              styles.amount, 
              { color: transaction.type === 'income' ? colors.success : colors.danger }
            ]}
          >
            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
          </Text>
        </View>
        
        <View style={styles.bottomRow}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {transaction.description || '(Sem descrição)'}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  fixedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fixedText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    flex: 1,
  },
  date: {
    fontSize: 12,
  }
});

export default TransactionItem;