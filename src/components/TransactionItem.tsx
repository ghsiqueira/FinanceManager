// src/components/TransactionItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, ColorTheme, TransactionItemProps } from '../types';

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, colors, onPress }) => {
  // Função para formatar a data
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  // Função para formatar o valor monetário
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  // Ícone e cor baseados na categoria
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'alimentação':
      case 'food':
        return { name: 'restaurant' as any, color: colors.danger };
      case 'transporte':
      case 'transport':
        return { name: 'car' as any, color: colors.info };
      case 'moradia':
      case 'housing':
        return { name: 'home' as any, color: colors.warning };
      case 'saúde':
      case 'health':
        return { name: 'medical' as any, color: colors.danger };
      case 'educação':
      case 'education':
        return { name: 'school' as any, color: colors.primary };
      case 'lazer':
      case 'leisure':
        return { name: 'game-controller' as any, color: colors.secondary };
      case 'salário':
      case 'salary':
        return { name: 'cash' as any, color: colors.success };
      case 'investimento':
      case 'investment':
        return { name: 'trending-up' as any, color: colors.info };
      default:
        return { name: 'pricetag' as any, color: colors.textSecondary };
    }
  };  

  const { name, color } = getCategoryIcon(transaction.category);

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={name as any} size={20} color={color} />
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.topRow}>
          <View style={styles.categoryContainer}>
            <Text style={[styles.category, { color: colors.text }]}>{transaction.category}</Text>
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
          <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(transaction.date)}</Text>
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