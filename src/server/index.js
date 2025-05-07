const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
}));
app.use(express.json());

// Função para gerar e salvar JWT_SECRET no arquivo .env
const generateAndSaveJwtSecret = () => {
  try {
    // Gerar uma chave secreta aleatória
    const newSecret = crypto.randomBytes(64).toString('hex');
    
    // Caminho para o arquivo .env
    const envPath = path.resolve(process.cwd(), '.env');
    
    // Ler o conteúdo atual do arquivo .env
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (err) {
      // Arquivo não existe ou erro na leitura
      console.log('Criando novo arquivo .env');
      envContent = '';
    }
    
    // Verificar se JWT_SECRET já existe
    const regex = /JWT_SECRET=.*/;
    
    if (regex.test(envContent)) {
      // Substituir JWT_SECRET existente
      envContent = envContent.replace(regex, `JWT_SECRET=${newSecret}`);
    } else {
      // Adicionar JWT_SECRET ao arquivo
      envContent += `\nJWT_SECRET=${newSecret}`;
    }
    
    // Salvar o arquivo .env atualizado
    fs.writeFileSync(envPath, envContent);
    
    console.log('Nova JWT_SECRET gerada e salva no arquivo .env');
    return newSecret;
  } catch (error) {
    console.error('Erro ao gerar e salvar JWT_SECRET:', error);
    return crypto.randomBytes(64).toString('hex'); // Retorna uma chave mesmo se falhar o salvamento
  }
};

// Verificar se JWT_SECRET existe, se não, gerar e salvar
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.log('JWT_SECRET não encontrada no ambiente. Gerando nova chave...');
  JWT_SECRET = generateAndSaveJwtSecret();
}

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Modelo de Usuário
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
});

// Modelo de Transação - ATUALIZADO com recorrência
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  description: { type: String },
  isFixed: { type: Boolean, default: false },
  recurrence: { 
    isRecurrent: { type: Boolean, default: false },
    frequency: { type: String, enum: ['monthly', 'weekly', 'yearly'], default: 'monthly' },
    dayOfMonth: { type: Number },
    dayOfWeek: { type: Number },
    month: { type: Number },
    nextDate: { type: Date }
  },
  date: { type: Date, default: Date.now }
});

// Modelo de Meta Financeira
const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  isExpense: { type: Boolean, default: false }, // se é uma economia ou gasto programado
  category: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Modelo de Orçamento
const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'weekly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true }
});

// Modelo de Investimento
const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['ações', 'fundos', 'renda fixa', 'poupança', 'outros'], required: true },
  initialAmount: { type: Number, required: true },
  currentAmount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  expectedReturn: { type: Number },
  description: { type: String }
});

// Modelo para Transações de Investimento
const investmentTransactionSchema = new mongoose.Schema({
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['aporte', 'resgate', 'rendimento'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Goal = mongoose.model('Goal', goalSchema);
const Budget = mongoose.model('Budget', budgetSchema);
const Investment = mongoose.model('Investment', investmentSchema);
const InvestmentTransaction = mongoose.model('InvestmentTransaction', investmentTransactionSchema);

// Middleware de autenticação
const auth = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Sem token, autorização negada' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Rotas de usuário
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar novo usuário
    const user = new User({
      email,
      password: hashedPassword,
      name
    });
    
    await user.save();
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ token, user: { id: user._id, email, name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Procurar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, email, name: user.name, theme: user.theme } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      theme: user.theme
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token inválido' });
  }
});

// Atualizar preferências do usuário (tema)
app.put('/api/user/preferences', auth, async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      return res.status(400).json({ message: 'Tema inválido' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    if (theme) user.theme = theme;
    
    await user.save();
    
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      theme: user.theme
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rotas para transações
app.post('/api/transactions', auth, async (req, res) => {
  try {
    const { amount, type, category, description, isFixed, recurrence, date } = req.body;
    
    const transaction = new Transaction({
      userId: req.user.userId,
      amount,
      type,
      category,
      description,
      isFixed: isFixed || false,
      recurrence: recurrence || { isRecurrent: false },
      date: date || Date.now()
    });
    
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/transactions/fixed', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.user.userId,
      isFixed: true 
    }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/transactions/recurrent', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ 
      userId: req.user.userId,
      'recurrence.isRecurrent': true 
    }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/transactions/:id', auth, async (req, res) => {
  try {
    const { amount, type, category, description, isFixed, recurrence, date } = req.body;
    
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    if (amount !== undefined) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (isFixed !== undefined) transaction.isFixed = isFixed;
    if (recurrence) transaction.recurrence = recurrence;
    if (date) transaction.date = date;
    
    await transaction.save();
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.delete('/api/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    res.json({ message: 'Transação removida' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rotas para estatísticas
app.get('/api/stats', auth, async (req, res) => {
  try {
    const { period } = req.query;
    let dateFilter = {};
    
    // Configurar filtro de data
    const now = new Date();
    if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { date: { $gte: startOfWeek } };
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { date: { $gte: startOfMonth } };
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { date: { $gte: startOfYear } };
    }
    
    // Buscar todas as transações do período
    const transactions = await Transaction.find({
      userId: req.user.userId,
      ...dateFilter
    });
    
    // Calcular totais
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const fixedExpense = transactions
      .filter(t => t.type === 'expense' && t.isFixed)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const variableExpense = transactions
      .filter(t => t.type === 'expense' && !t.isFixed)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calcular por categoria
    const categorySummary = {};
    transactions.forEach(t => {
      if (!categorySummary[t.category]) {
        categorySummary[t.category] = {
          income: 0,
          expense: 0,
          fixedExpense: 0,
          variableExpense: 0
        };
      }
      
      categorySummary[t.category][t.type] += t.amount;
      
      if (t.type === 'expense') {
        if (t.isFixed) {
          categorySummary[t.category].fixedExpense += t.amount;
        } else {
          categorySummary[t.category].variableExpense += t.amount;
        }
      }
    });
    
    res.json({
      income,
      expense,
      fixedExpense,
      variableExpense,
      balance: income - expense,
      categorySummary
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rotas para metas financeiras
app.post('/api/goals', auth, async (req, res) => {
  try {
    const { title, targetAmount, targetDate, isExpense, category, description } = req.body;
    
    const goal = new Goal({
      userId: req.user.userId,
      title,
      targetAmount,
      currentAmount: 0,
      targetDate,
      isExpense,
      category,
      description
    });
    
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/goals', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.userId }).sort({ targetDate: 1 });
    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/goals/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/goals/:id', auth, async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, targetDate, isExpense, category, description } = req.body;
    
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    if (title) goal.title = title;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) goal.currentAmount = currentAmount;
    if (targetDate) goal.targetDate = targetDate;
    if (isExpense !== undefined) goal.isExpense = isExpense;
    if (category) goal.category = category;
    if (description !== undefined) goal.description = description;
    
    await goal.save();
    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.delete('/api/goals/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    res.json({ message: 'Meta removida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rotas para orçamentos
app.post('/api/budgets', auth, async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate, isActive } = req.body;
    
    const budget = new Budget({
      userId: req.user.userId,
      category,
      amount,
      period: period || 'monthly',
      startDate: startDate || Date.now(),
      endDate,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/budgets', auth, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.userId }).sort({ category: 1 });
    res.json(budgets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/budgets/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!budget) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/budgets/:id', auth, async (req, res) => {
  try {
    const { category, amount, period, startDate, endDate, isActive } = req.body;
    
    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!budget) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }
    
    if (category) budget.category = category;
    if (amount !== undefined) budget.amount = amount;
    if (period) budget.period = period;
    if (startDate) budget.startDate = startDate;
    if (endDate !== undefined) budget.endDate = endDate;
    if (isActive !== undefined) budget.isActive = isActive;
    
    await budget.save();
    res.json(budget);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.delete('/api/budgets/:id', auth, async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    
    if (!budget) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }
    
    res.json({ message: 'Orçamento removido com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rotas para investimentos
app.post('/api/investments', auth, async (req, res) => {
  try {
    const { name, type, initialAmount, currentAmount, startDate, expectedReturn, description } = req.body;
    
    const investment = new Investment({
      userId: req.user.userId,
      name,
      type,
      initialAmount,
      currentAmount: currentAmount || initialAmount,
      startDate: startDate || Date.now(),
      expectedReturn,
      description
    });
    
    await investment.save();
    res.status(201).json(investment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/investments', auth, async (req, res) => {
  try {
    const investments = await Investment.find({ userId: req.user.userId }).sort({ name: 1 });
    res.json(investments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/investments/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!investment) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }
    
    res.json(investment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.put('/api/investments/:id', auth, async (req, res) => {
  try {
    const { name, type, initialAmount, currentAmount, startDate, expectedReturn, description } = req.body;
    
    const investment = await Investment.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!investment) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }
    
    if (name) investment.name = name;
    if (type) investment.type = type;
    if (initialAmount !== undefined) investment.initialAmount = initialAmount;
    if (currentAmount !== undefined) investment.currentAmount = currentAmount;
    if (startDate) investment.startDate = startDate;
    if (expectedReturn !== undefined) investment.expectedReturn = expectedReturn;
    if (description !== undefined) investment.description = description;
    
    await investment.save();
    res.json(investment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.delete('/api/investments/:id', auth, async (req, res) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    
    if (!investment) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }
    
    // Remover também todas as transações relacionadas a este investimento
    await InvestmentTransaction.deleteMany({ investmentId: req.params.id });
    
    res.json({ message: 'Investimento removido com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rotas para transações de investimento
app.post('/api/investment-transactions', auth, async (req, res) => {
  try {
    const { investmentId, type, amount, date, description } = req.body;
    
    // Verificar se o investimento existe e pertence ao usuário
    const investment = await Investment.findOne({ _id: investmentId, userId: req.user.userId });
    if (!investment) {
      return res.status(404).json({ message: 'Investimento não encontrado' });
    }
    
    const transaction = new InvestmentTransaction({
      investmentId,
      userId: req.user.userId,
      type,
      amount,
      date: date || Date.now(),
      description
    });
    
    await transaction.save();
    
    // Atualizar o valor atual do investimento
    if (type === 'aporte') {
      investment.currentAmount += amount;
    } else if (type === 'resgate') {
      investment.currentAmount -= amount;
    } else if (type === 'rendimento') {
      investment.currentAmount += amount;
    }
    
    await investment.save();
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

app.get('/api/investment-transactions/:investmentId', auth, async (req, res) => {
  try {
    const transactions = await InvestmentTransaction.find({ 
      investmentId: req.params.investmentId,
      userId: req.user.userId
    }).sort({ date: -1 });
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Previsão financeira
app.get('/api/forecast', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsCount = parseInt(months);
    
    if (isNaN(monthsCount) || monthsCount <= 0 || monthsCount > 36) {
      return res.status(400).json({ message: 'Número de meses inválido (1-36)' });
    }
    
    // Buscar todas as transações dos últimos 3 meses para calcular médias
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const transactions = await Transaction.find({
      userId: req.user.userId,
      date: { $gte: threeMonthsAgo }
    });
    
    // Calcular médias mensais de receitas e despesas
    const endOfLastMonth = new Date();
    endOfLastMonth.setDate(1);
    endOfLastMonth.setHours(0, 0, 0, 0);
    endOfLastMonth.setDate(endOfLastMonth.getDate() - 1);
    
    // Filtrar transações por mês e tipo
    const getMonthlyAverage = (type) => {
      const monthlyTotals = {};
      
      transactions.filter(t => t.type === type).forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyTotals[key]) {
          monthlyTotals[key] = 0;
        }
        
        monthlyTotals[key] += t.amount;
      });
      
      const months = Object.keys(monthlyTotals).length || 1;
      const total = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
      
      return total / months;
    };
    
    // Calcular médias
    const avgMonthlyIncome = getMonthlyAverage('income');
    const avgMonthlyExpense = getMonthlyAverage('expense');
    
    // Buscar transações recorrentes
    const recurrentTransactions = await Transaction.find({
      userId: req.user.userId,
      $or: [
        { isFixed: true },
        { 'recurrence.isRecurrent': true }
      ]
    });
    
    // Criar previsão para os próximos meses
    const forecast = [];
    let balance = 0;
    
    // Obter saldo atual (transações do mês corrente)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const currentMonthTransactions = await Transaction.find({
      userId: req.user.userId,
      date: { $gte: currentMonth }
    });
    
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    balance = currentIncome - currentExpense;
    
    // Gerar previsão
    for (let i = 0; i < monthsCount; i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      forecastDate.setDate(1);
      forecastDate.setHours(0, 0, 0, 0);
      
      // Mês e ano da previsão
      const month = forecastDate.getMonth();
      const year = forecastDate.getFullYear();
      
      // Receitas fixas e variáveis para o mês
      let fixedIncome = 0;
      let variableIncome = 0;
      
      // Despesas fixas e variáveis para o mês
      let fixedExpense = 0;
      let variableExpense = 0;
      
      // Adicionar transações recorrentes
      recurrentTransactions.forEach(t => {
        // Verificar se a transação recorrente se aplica a este mês
        let isApplicable = false;
        
        if (t.recurrence && t.recurrence.isRecurrent) {
          const freq = t.recurrence.frequency || 'monthly';
          
          if (freq === 'monthly') {
            isApplicable = true;
          } else if (freq === 'yearly' && t.recurrence.month === month) {
            isApplicable = true;
          } else if (freq === 'weekly') {
            // Simplificação: assumir 4 semanas por mês
            isApplicable = true;
          }
        } else if (t.isFixed) {
          isApplicable = true;
        }
        
        if (isApplicable) {
          if (t.type === 'income') {
            fixedIncome += t.amount;
          } else {
            fixedExpense += t.amount;
          }
        }
      });
      
      // Adicionar médias para variáveis
      variableIncome = avgMonthlyIncome - fixedIncome;
      variableExpense = avgMonthlyExpense - fixedExpense;
      
      // Garantir que não temos valores negativos
      variableIncome = Math.max(0, variableIncome);
      variableExpense = Math.max(0, variableExpense);
      
      // Calcular saldo do mês
      const monthlyBalance = (fixedIncome + variableIncome) - (fixedExpense + variableExpense);
      balance += monthlyBalance;
      
      forecast.push({
        date: forecastDate,
        month: month + 1, // 1-12 em vez de 0-11
        year,
        fixedIncome,
        variableIncome,
        totalIncome: fixedIncome + variableIncome,
        fixedExpense,
        variableExpense,
        totalExpense: fixedExpense + variableExpense,
        monthlyBalance,
        accumulatedBalance: balance
      });
    }
    
    res.json({ forecast });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));