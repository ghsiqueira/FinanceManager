// src/components/TransactionItem.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: () => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete }) => {
  // Função para formatar a data
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  // Ícone e cor baseados na categoria
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'alimentação':
      case 'food':
        return { name: 'restaurant' as any, color: '#FF6B6B' };
      case 'transporte':
      case 'transport':
        return { name: 'car' as any, color: '#4ECDC4' };
      case 'moradia':
      case 'housing':
        return { name: 'home' as any, color: '#FF9F1C' };
        case 'saúde':
          case 'health':
            return { name: 'medical' as any, color: '#F94144' };
          case 'educação':
          case 'education':
            return { name: 'school' as any, color: '#577590' };
          case 'lazer':
          case 'leisure':
            return { name: 'game-controller' as any, color: '#8338EC' };
          case 'salário':
          case 'salary':
            return { name: 'cash' as any, color: '#06D6A0' };
          case 'investimento':
          case 'investment':
            return { name: 'trending-up' as any, color: '#118AB2' };
          default:
            return { name: 'pricetag' as any, color: '#999' };
        }
      };  
    
      const { name, color } = getCategoryIcon(transaction.category);
    
      return (
        <View style={styles.container}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={name as any} size={20} color={color} />
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.topRow}>
              <View style={styles.categoryContainer}>
                <Text style={styles.category}>{transaction.category}</Text>
                {transaction.isFixed && (
                  <View style={styles.fixedBadge}>
                    <Text style={styles.fixedText}>Fixa</Text>
                  </View>
                )}
              </View>
              <Text 
                style={[
                  styles.amount, 
                  transaction.type === 'income' ? styles.income : styles.expense
                ]}
              >
                {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.bottomRow}>
              <Text style={styles.description}>
                {transaction.description || '(Sem descrição)'}
              </Text>
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={onDelete}
          >
            <Ionicons name={"trash-outline" as any} size={18} color="#999" />
          </TouchableOpacity>
        </View>
      );
    };
    
    const styles = StyleSheet.create({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
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
        color: '#2e2e2e',
        marginRight: 5,
      },
      fixedBadge: {
        backgroundColor: '#6200ee20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
      },
      fixedText: {
        fontSize: 10,
        color: '#6200ee',
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
      income: {
        color: 'green',
      },
      expense: {
        color: 'red',
      },
      description: {
        fontSize: 14,
        color: '#666',
        flex: 1,
      },
      date: {
        fontSize: 12,
        color: '#999',
      },
      deleteButton: {
        padding: 5,
        marginLeft: 10,
      },
    });
    
    export default TransactionItem;
    