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
  createdAt: { type: Date, default: Date.now }
});

// Modelo de Transação - ATUALIZADO com isFixed
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  description: { type: String },
  isFixed: { type: Boolean, default: false }, // Nova propriedade para despesas fixas
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Rota de registro
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

// Rota de login
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
    
    res.json({ token, user: { id: user._id, email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rota para obter dados do usuário atual
app.get('/api/user', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Sem token, autorização negada' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json({
      id: user._id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token inválido' });
  }
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

// Rotas para transações - ATUALIZADO para incluir isFixed
app.post('/api/transactions', auth, async (req, res) => {
  try {
    const { amount, type, category, description, isFixed, date } = req.body;
    
    const transaction = new Transaction({
      userId: req.user.userId,
      amount,
      type,
      category,
      description,
      isFixed: isFixed || false, // Valor padrão caso não seja fornecido
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

// Rota para obter apenas despesas fixas
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
    const { amount, type, category, description, isFixed, date } = req.body;
    
    // Verificar se a transação existe e pertence ao usuário
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transação não encontrada' });
    }
    
    // Atualizar campos
    transaction.amount = amount || transaction.amount;
    transaction.type = type || transaction.type;
    transaction.category = category || transaction.category;
    transaction.description = description !== undefined ? description : transaction.description;
    transaction.isFixed = isFixed !== undefined ? isFixed : transaction.isFixed;
    transaction.date = date || transaction.date;
    
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

// Rotas para estatísticas - ATUALIZADA para incluir dados de despesas fixas
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} localmente`);
  console.log(`Ou http://SEU_IP:${PORT} de dispositivos na mesma rede`);
});