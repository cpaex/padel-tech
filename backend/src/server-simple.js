const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006', 'http://localhost:8081'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Datos en memoria para desarrollo
let users = [];
let analyses = [];
let nextUserId = 1;
let nextAnalysisId = 1;

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'development',
    message: 'Backend funcionando en modo desarrollo (sin base de datos)'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'PadelTech API - Modo Desarrollo',
    version: '1.0.0',
    description: 'API para análisis de técnica de pádel (modo desarrollo sin base de datos)',
    mode: 'development',
    database: 'in-memory',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      analysis: '/api/analysis',
      stats: '/api/stats'
    }
  });
});

// Simular autenticación
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe con este email'
      });
    }

    // Crear nuevo usuario
    const newUser = {
      id: nextUserId++,
      name,
      email,
      password: 'hashed_password_here', // En producción usar bcrypt
      profile: {
        level: 'beginner',
        experience: 0,
        favoriteShot: 'derecha'
      },
      stats: {
        totalAnalyses: 0,
        averageScore: 0,
        bestScore: 0
      },
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generar token simulado
    const token = `dev_token_${newUser.id}_${Date.now()}`;

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          profile: newUser.profile,
          stats: newUser.stats
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // En desarrollo, aceptamos cualquier contraseña
    if (password !== '123456') {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas (usa 123456 en desarrollo)'
      });
    }

    // Generar token simulado
    const token = `dev_token_${user.id}_${Date.now()}`;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          stats: user.stats
        },
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Middleware de autenticación simulado
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  const token = authHeader.substring(7);
  
  // En desarrollo, extraer ID del token simulado
  const tokenParts = token.split('_');
  if (tokenParts.length < 3) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }

  const userId = parseInt(tokenParts[2]);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no encontrado'
    });
  }

  req.user = {
    userId: user.id,
    email: user.email,
    name: user.name
  };

  next();
};

// Endpoints protegidos
app.post('/api/analysis', authMiddleware, (req, res) => {
  try {
    const { shotType, results, video, improvements } = req.body;
    
    if (!shotType || !results || !video) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    // Crear nuevo análisis
    const newAnalysis = {
      id: nextAnalysisId++,
      userId: req.user.userId,
      shotType,
      results,
      video,
      improvements: improvements || [],
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    analyses.push(newAnalysis);

    // Actualizar estadísticas del usuario
    const user = users.find(u => u.id === req.user.userId);
    if (user) {
      user.stats.totalAnalyses += 1;
      user.stats.averageScore = ((user.stats.averageScore * (user.stats.totalAnalyses - 1)) + results.overallScore) / user.stats.totalAnalyses;
      if (results.overallScore > user.stats.bestScore) {
        user.stats.bestScore = results.overallScore;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Análisis creado exitosamente',
      data: {
        analysis: {
          id: newAnalysis.id,
          shotType: newAnalysis.shotType,
          overallScore: newAnalysis.results.overallScore,
          status: newAnalysis.status,
          createdAt: newAnalysis.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error creando análisis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/analysis', authMiddleware, (req, res) => {
  try {
    const userAnalyses = analyses.filter(a => a.userId === req.user.userId);
    
    res.json({
      success: true,
      data: {
        analyses: userAnalyses.map(analysis => ({
          id: analysis.id,
          shotType: analysis.shotType,
          overallScore: analysis.results.overallScore,
          status: analysis.status,
          createdAt: analysis.createdAt
        })),
        pagination: {
          page: 1,
          limit: userAnalyses.length,
          total: userAnalyses.length,
          pages: 1
        },
        stats: {
          totalAnalyses: userAnalyses.length,
          averageScore: userAnalyses.length > 0 ? 
            userAnalyses.reduce((sum, a) => sum + a.results.overallScore, 0) / userAnalyses.length : 0,
          bestScore: userAnalyses.length > 0 ? 
            Math.max(...userAnalyses.map(a => a.results.overallScore)) : 0
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo análisis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/users/profile', authMiddleware, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile: user.profile,
          stats: user.stats,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor PadelTech (Modo Desarrollo) corriendo en puerto ${PORT}`);
  console.log(`📱 Ambiente: development (sin base de datos)`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
  console.log(`\n💡 Para desarrollo rápido:`);
  console.log(`   - Usa cualquier email y contraseña '123456'`);
  console.log(`   - Los datos se almacenan en memoria`);
  console.log(`   - Reinicia el servidor para limpiar datos`);
});

module.exports = app;
