// src/components/CategoryChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategoryChartProps {
  data: {
    category: string;
    value: number;
    percentage: number;
  }[];
  isDark: boolean;
  colors: any;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, isDark, colors }) => {
  // Ordenar dados por valor (maior para menor)
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Garantir no máximo 5 categorias
  const topCategories = sortedData.slice(0, 5);
  
  // Se tivermos mais de 5 categorias, adicionar "Outros"
  if (sortedData.length > 5) {
    const othersSum = sortedData.slice(5).reduce((sum, item) => sum + item.value, 0);
    const othersPercentage = sortedData.slice(5).reduce((sum, item) => sum + item.percentage, 0);
    
    topCategories.push({
      category: 'Outros',
      value: othersSum,
      percentage: othersPercentage
    });
  }

  // Cores para as categorias
  const chartColors = [
    colors.primary,
    colors.secondary,
    colors.info,
    colors.success,
    colors.warning,
    colors.danger
  ];

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {topCategories.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhum dado disponível para o período selecionado
        </Text>
      ) : (
        <>
          {topCategories.map((item, index) => (
            <View key={item.category} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={[styles.colorIndicator, { backgroundColor: chartColors[index % chartColors.length] }]} />
                <Text style={[styles.categoryName, { color: colors.text }]}>
                  {item.category}
                </Text>
                <Text style={[styles.percentage, { color: colors.textSecondary }]}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
              
              <View style={[styles.bar, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                <View 
                  style={[
                    styles.fill, 
                    { 
                      width: `${Math.min(item.percentage, 100)}%`,
                      backgroundColor: chartColors[index % chartColors.length]
                    }
                  ]} 
                />
              </View>
              
              <Text style={[styles.value, { color: colors.text }]}>
                {formatCurrency(item.value)}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 30,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
  },
  percentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  bar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  value: {
    fontSize: 12,
    textAlign: 'right',
  }
});

export default CategoryChart;