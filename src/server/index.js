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

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'API de Finanças Pessoais está funcionando!',
    version: '1.0.0',
    timestamp: new Date()
  });
});

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

// 1. Rota para editar perfil do usuário
app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword, photoUrl } = req.body;
    
    // Buscar usuário atual
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar se o email já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Este e-mail já está em uso por outro usuário' });
      }
    }
    
    // Se estiver alterando a senha, verificar a senha atual
    if (newPassword && currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }
      
      // Hash da nova senha
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Atualizar dados
    user.name = name || user.name;
    user.email = email || user.email;
    
    if (photoUrl) {
      user.photoUrl = photoUrl;
    }
    
    await user.save();
    
    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoUrl: user.photoUrl,
        theme: user.theme
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

// 2. Rotas para gerenciar foto de perfil
app.post('/api/user/profile-photo', auth, async (req, res) => {
  try {
    // Esta é apenas uma simulação - em um ambiente real você precisaria de upload de arquivos
    // usando multer ou similar, e armazenamento em AWS S3, Firebase Storage, etc.
    // Para simplificar, vamos apenas simular o armazenamento da URL
    
    const fakePhotoUrl = `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`;
    
    // Atualizar a URL da foto no perfil do usuário
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    user.photoUrl = fakePhotoUrl;
    await user.save();
    
    res.json({
      message: 'Foto de perfil atualizada com sucesso',
      photoUrl: fakePhotoUrl
    });
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error);
    res.status(500).json({ message: 'Erro ao atualizar foto de perfil' });
  }
});

app.delete('/api/user/profile-photo', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    user.photoUrl = undefined;
    await user.save();
    
    res.json({ message: 'Foto de perfil removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover foto de perfil:', error);
    res.status(500).json({ message: 'Erro ao remover foto de perfil' });
  }
});

app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      theme: user.theme
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

// 3. Modelo e Rota para histórico de transações das metas
// Adicionar o modelo ao topo do arquivo, junto com os outros modelos:
const goalTransactionSchema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  description: { type: String },
  date: { type: Date, default: Date.now }
});

const GoalTransaction = mongoose.model('GoalTransaction', goalTransactionSchema);

// Rota para obter histórico de transações de uma meta
app.get('/api/goals/:id/history', auth, async (req, res) => {
  try {
    // Verificar se a meta existe e pertence ao usuário
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    // Buscar transações da meta
    const transactions = await GoalTransaction.find({
      goalId: req.params.id
    }).sort({ date: 1 });
    
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar histórico da meta:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico da meta' });
  }
});

// Rota para adicionar transação à meta
app.post('/api/goals/:id/transaction', auth, async (req, res) => {
  try {
    const { amount, type, description } = req.body;
    
    // Verificar se a meta existe e pertence ao usuário
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!goal) {
      return res.status(404).json({ message: 'Meta não encontrada' });
    }
    
    // Validar valor
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valor inválido' });
    }
    
    // Validar tipo
    if (!['deposit', 'withdraw'].includes(type)) {
      return res.status(400).json({ message: 'Tipo de transação inválido' });
    }
    
    // Atualizar valor atual da meta
    if (type === 'deposit') {
      goal.currentAmount += amount;
    } else {
      goal.currentAmount = Math.max(0, goal.currentAmount - amount);
    }
    
    await goal.save();
    
    // Registrar transação
    const transaction = new GoalTransaction({
      goalId: req.params.id,
      userId: req.user.userId,
      amount,
      type,
      description,
      date: Date.now()
    });
    
    await transaction.save();
    
    res.status(201).json({
      message: 'Transação adicionada com sucesso',
      transaction,
      currentAmount: goal.currentAmount
    });
  } catch (error) {
    console.error('Erro ao adicionar transação:', error);
    res.status(500).json({ message: 'Erro ao adicionar transação' });
  }
});

// 4. Melhoria para a previsão financeira - ajustes manuais
// Adicionar o modelo ao topo do arquivo, junto com os outros modelos:
const forecastAdjustmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 0-11
  year: { type: Number, required: true },
  incomeAdjustment: { type: Number, default: 0 },
  expenseAdjustment: { type: Number, default: 0 },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const ForecastAdjustment = mongoose.model('ForecastAdjustment', forecastAdjustmentSchema);

// Rota para obter ajustes de previsão
app.get('/api/forecast/adjustments', auth, async (req, res) => {
  try {
    const adjustments = await ForecastAdjustment.find({
      userId: req.user.userId
    }).sort({ year: 1, month: 1 });
    
    res.json(adjustments);
  } catch (error) {
    console.error('Erro ao buscar ajustes de previsão:', error);
    res.status(500).json({ message: 'Erro ao buscar ajustes de previsão' });
  }
});

// Rota para adicionar ou atualizar ajuste
app.post('/api/forecast/adjustments', auth, async (req, res) => {
  try {
    const { month, year, incomeAdjustment, expenseAdjustment, description } = req.body;
    
    // Validações
    if (month < 0 || month > 11) {
      return res.status(400).json({ message: 'Mês inválido (0-11)' });
    }
    
    if (!year || year < new Date().getFullYear()) {
      return res.status(400).json({ message: 'Ano inválido' });
    }
    
    // Verificar se já existe um ajuste para este mês/ano
    let adjustment = await ForecastAdjustment.findOne({
      userId: req.user.userId,
      month,
      year
    });
    
    if (adjustment) {
      // Atualizar ajuste existente
      adjustment.incomeAdjustment = incomeAdjustment || 0;
      adjustment.expenseAdjustment = expenseAdjustment || 0;
      adjustment.description = description;
    } else {
      // Criar novo ajuste
      adjustment = new ForecastAdjustment({
        userId: req.user.userId,
        month,
        year,
        incomeAdjustment: incomeAdjustment || 0,
        expenseAdjustment: expenseAdjustment || 0,
        description
      });
    }
    
    await adjustment.save();
    
    res.status(201).json({
      message: 'Ajuste salvo com sucesso',
      adjustment
    });
  } catch (error) {
    console.error('Erro ao salvar ajuste de previsão:', error);
    res.status(500).json({ message: 'Erro ao salvar ajuste de previsão' });
  }
});

// Rota para remover ajuste
app.delete('/api/forecast/adjustments/:id', auth, async (req, res) => {
  try {
    const adjustment = await ForecastAdjustment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!adjustment) {
      return res.status(404).json({ message: 'Ajuste não encontrado' });
    }
    
    res.json({ message: 'Ajuste removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover ajuste de previsão:', error);
    res.status(500).json({ message: 'Erro ao remover ajuste de previsão' });
  }
});

// 5. Melhoria na rota de previsão financeira para incluir ajustes manuais e detalhes de fixo/variável
// Modificar a rota GET /api/forecast para incluir ajustes e mais detalhes
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
    
    // Buscar transações recorrentes
    const recurrentTransactions = await Transaction.find({
      userId: req.user.userId,
      $or: [
        { isFixed: true },
        { 'recurrence.isRecurrent': true }
      ]
    });
    
    // Buscar ajustes manuais
    const adjustments = await ForecastAdjustment.find({
      userId: req.user.userId
    });
    
    // Calcular médias mensais de receitas e despesas fixas e variáveis
    const getMonthlyAverages = () => {
      const fixedIncome = recurrentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const fixedExpense = recurrentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular médias de variáveis
      const monthlyTotals = {
        income: {},
        expense: {}
      };
      
      transactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!monthlyTotals[t.type][key]) {
          monthlyTotals[t.type][key] = 0;
        }
        
        monthlyTotals[t.type][key] += t.amount;
      });
      
      const incomeMonths = Object.keys(monthlyTotals.income).length || 1;
      const expenseMonths = Object.keys(monthlyTotals.expense).length || 1;
      
      const totalIncome = Object.values(monthlyTotals.income).reduce((sum, val) => sum + val, 0);
      const totalExpense = Object.values(monthlyTotals.expense).reduce((sum, val) => sum + val, 0);
      
      // Total médio - fixo = variável
      const variableIncome = Math.max(0, (totalIncome / incomeMonths) - fixedIncome);
      const variableExpense = Math.max(0, (totalExpense / expenseMonths) - fixedExpense);
      
      return {
        fixedIncome,
        variableIncome,
        fixedExpense,
        variableExpense
      };
    };
    
    const averages = getMonthlyAverages();
    
    // Calcular categorias para breakdowns
    const calculateCategoryBreakdown = (type) => {
      const breakdown = {};
      
      // Adicionar categorias de transações fixas/recorrentes
      recurrentTransactions
        .filter(t => t.type === type)
        .forEach(t => {
          if (!breakdown[t.category]) {
            breakdown[t.category] = 0;
          }
          breakdown[t.category] += t.amount;
        });
      
      // Adicionar médias de categorias variáveis
      const categoryTotals = {};
      const categoryCounts = {};
      
      transactions
        .filter(t => t.type === type && !t.isFixed && (!t.recurrence || !t.recurrence.isRecurrent))
        .forEach(t => {
          if (!categoryTotals[t.category]) {
            categoryTotals[t.category] = 0;
            categoryCounts[t.category] = 0;
          }
          categoryTotals[t.category] += t.amount;
          categoryCounts[t.category]++;
        });
      
      // Calcular média para cada categoria
      Object.keys(categoryTotals).forEach(category => {
        const average = categoryTotals[category] / (categoryCounts[category] || 1);
        if (!breakdown[category]) {
          breakdown[category] = 0;
        }
        breakdown[category] += average;
      });
      
      return breakdown;
    };
    
    // Gerar previsão
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
    
    // Gerar previsão mês a mês
    for (let i = 0; i < monthsCount; i++) {
      const forecastDate = new Date();
      forecastDate.setMonth(forecastDate.getMonth() + i + 1);
      forecastDate.setDate(1);
      forecastDate.setHours(0, 0, 0, 0);
      
      // Mês e ano da previsão
      const month = forecastDate.getMonth();
      const year = forecastDate.getFullYear();
      
      // Obter ajustes manuais, se existirem
      const adjustment = adjustments.find(a => a.month === month && a.year === year);
      
      // Receitas e despesas base para o mês (fixas + variáveis médias)
      let fixedIncome = averages.fixedIncome;
      let variableIncome = averages.variableIncome;
      let fixedExpense = averages.fixedExpense;
      let variableExpense = averages.variableExpense;
      
      // Adicionar ajustes manuais, se existirem
      const incomeAdjustment = adjustment ? adjustment.incomeAdjustment : 0;
      const expenseAdjustment = adjustment ? adjustment.expenseAdjustment : 0;
      
      // Calcular totais
      const totalIncome = fixedIncome + variableIncome + incomeAdjustment;
      const totalExpense = fixedExpense + variableExpense + expenseAdjustment;
      const monthlyBalance = totalIncome - totalExpense;
      
      balance += monthlyBalance;
      
      forecast.push({
        date: forecastDate,
        month: month + 1, // 1-12 em vez de 0-11
        year,
        fixedIncome,
        variableIncome,
        incomeAdjustment,
        totalIncome,
        fixedExpense,
        variableExpense,
        expenseAdjustment,
        totalExpense,
        monthlyBalance,
        accumulatedBalance: balance,
        incomeBreakdown: calculateCategoryBreakdown('income'),
        expenseBreakdown: calculateCategoryBreakdown('expense'),
        adjustment: adjustment ? {
          id: adjustment._id,
          description: adjustment.description
        } : null
      });
    }
    
    res.json({ forecast });
  } catch (error) {
    console.error('Erro ao gerar previsão financeira:', error);
    res.status(500).json({ message: 'Erro ao gerar previsão financeira' });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));