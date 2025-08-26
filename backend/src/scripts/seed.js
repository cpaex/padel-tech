const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Analysis = require('../models/Analysis');

// Datos de prueba
const testUsers = [
  {
    name: 'Carlos Páez',
    email: 'carlos@padeltech.com',
    password: 'password123',
    profile: {
      level: 'intermediate',
      favoriteShot: 'derecha',
      experience: 2.5,
      bio: 'Entusiasta del pádel con 2 años de experiencia'
    }
  },
  {
    name: 'María García',
    email: 'maria@padeltech.com',
    password: 'password123',
    profile: {
      level: 'beginner',
      favoriteShot: 'volea',
      experience: 0.5,
      bio: 'Nueva en el mundo del pádel'
    }
  },
  {
    name: 'Juan López',
    email: 'juan@padeltech.com',
    password: 'password123',
    profile: {
      level: 'advanced',
      favoriteShot: 'bandeja',
      experience: 5.0,
      bio: 'Jugador experimentado con 5 años de práctica'
    }
  }
];

const testAnalyses = [
  {
    shotType: 'derecha',
    video: {
      url: '/uploads/sample-derecha.mp4',
      thumbnail: '/uploads/sample-derecha_thumb.jpg',
      duration: 8.5,
      size: 1024000,
      format: 'mp4',
      quality: '720p'
    },
    results: {
      overallScore: 85,
      posture: { 
        score: 88, 
        feedback: ['Excelente postura, espalda recta'],
        confidence: 0.95
      },
      timing: { 
        score: 82, 
        feedback: ['Buen timing, podría mejorar la anticipación'],
        confidence: 0.87
      },
      followThrough: { 
        score: 87, 
        feedback: ['Seguimiento perfecto del golpe'],
        confidence: 0.92
      },
      power: { 
        score: 83, 
        feedback: ['Potencia adecuada, control excelente'],
        confidence: 0.89
      }
    },
    improvements: [
      {
        category: 'timing',
        description: 'Mejorar la anticipación del movimiento',
        priority: 'medium',
        difficulty: 'moderate'
      },
      {
        category: 'general',
        description: 'Mantener la mirada en la pelota más tiempo',
        priority: 'low',
        difficulty: 'easy'
      }
    ],
    metadata: {
      device: 'mobile',
      location: 'Pista Central',
      weather: {
        temperature: 22,
        humidity: 65,
        conditions: 'Soleado'
      }
    }
  },
  {
    shotType: 'reves',
    video: {
      url: '/uploads/sample-reves.mp4',
      thumbnail: '/uploads/sample-reves_thumb.jpg',
      duration: 7.2,
      size: 890000,
      format: 'mp4',
      quality: '720p'
    },
    results: {
      overallScore: 78,
      posture: { 
        score: 75, 
        feedback: ['Postura correcta, espalda estable'],
        confidence: 0.88
      },
      timing: { 
        score: 80, 
        feedback: ['Timing adecuado, buena coordinación'],
        confidence: 0.85
      },
      followThrough: { 
        score: 72, 
        feedback: ['Seguimiento limitado, extender más el brazo'],
        confidence: 0.78
      },
      power: { 
        score: 83, 
        feedback: ['Potencia controlada, buen equilibrio'],
        confidence: 0.82
      }
    },
    improvements: [
      {
        category: 'followThrough',
        description: 'Extender más el brazo en el seguimiento',
        priority: 'high',
        difficulty: 'moderate'
      },
      {
        category: 'posture',
        description: 'Mejorar la rotación de hombros',
        priority: 'medium',
        difficulty: 'moderate'
      },
      {
        category: 'general',
        description: 'Practicar ejercicios de flexibilidad',
        priority: 'low',
        difficulty: 'easy'
      }
    ],
    metadata: {
      device: 'mobile',
      location: 'Pista Lateral',
      weather: {
        temperature: 20,
        humidity: 70,
        conditions: 'Nublado'
      }
    }
  },
  {
    shotType: 'volea',
    video: {
      url: '/uploads/sample-volea.mp4',
      thumbnail: '/uploads/sample-volea_thumb.jpg',
      duration: 6.8,
      size: 750000,
      format: 'mp4',
      quality: '720p'
    },
    results: {
      overallScore: 92,
      posture: { 
        score: 95, 
        feedback: ['Postura perfecta, posición ideal'],
        confidence: 0.98
      },
      timing: { 
        score: 90, 
        feedback: ['Timing excelente, anticipación perfecta'],
        confidence: 0.95
      },
      followThrough: { 
        score: 88, 
        feedback: ['Seguimiento fluido y natural'],
        confidence: 0.93
      },
      power: { 
        score: 95, 
        feedback: ['Potencia y control excepcionales'],
        confidence: 0.97
      }
    },
    improvements: [
      {
        category: 'general',
        description: 'Mantener este nivel de excelencia',
        priority: 'low',
        difficulty: 'easy'
      },
      {
        category: 'general',
        description: 'Considerar enseñar a otros jugadores',
        priority: 'low',
        difficulty: 'easy'
      }
    ],
    metadata: {
      device: 'mobile',
      location: 'Pista Principal',
      weather: {
        temperature: 25,
        humidity: 60,
        conditions: 'Soleado'
      }
    }
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/padeltech');
    console.log('✅ Conectado a MongoDB');
    
    // Limpiar colecciones existentes
    console.log('🧹 Limpiando colecciones existentes...');
    await User.deleteMany({});
    await Analysis.deleteMany({});
    console.log('✅ Colecciones limpiadas');
    
    // Crear usuarios de prueba
    console.log('👥 Creando usuarios de prueba...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword,
        stats: {
          totalAnalyses: 0,
          averageScore: 0,
          bestScore: 0,
          totalTime: 0,
          favoriteShot: userData.profile.favoriteShot
        }
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Usuario creado: ${savedUser.name} (${savedUser.email})`);
    }
    
    // Crear análisis de prueba
    console.log('📊 Creando análisis de prueba...');
    
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const userAnalyses = testAnalyses.slice(i, i + 1); // Cada usuario tiene 1 análisis
      
      for (const analysisData of userAnalyses) {
        const analysis = new Analysis({
          ...analysisData,
          userId: user._id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        });
        
        const savedAnalysis = await analysis.save();
        console.log(`✅ Análisis creado: ${savedAnalysis.shotType} para ${user.name}`);
        
        // Actualizar estadísticas del usuario
        user.stats.totalAnalyses += 1;
        user.stats.totalTime += analysisData.video.duration;
        
        // Calcular promedio de puntuación
        const userAnalysesList = await Analysis.find({ userId: user._id });
        const totalScore = userAnalysesList.reduce((sum, a) => sum + a.results.overallScore, 0);
        user.stats.averageScore = totalScore / userAnalysesList.length;
        user.stats.bestScore = Math.max(user.stats.bestScore, analysisData.results.overallScore);
        
        await user.save();
      }
    }
    
    console.log('🎉 Seed completado exitosamente!');
    console.log(`📊 Usuarios creados: ${createdUsers.length}`);
    console.log(`📊 Análisis creados: ${testAnalyses.length}`);
    
    // Mostrar resumen
    console.log('\n📋 Resumen de la base de datos:');
    const totalUsers = await User.countDocuments();
    const totalAnalyses = await Analysis.countDocuments();
    console.log(`👥 Total usuarios: ${totalUsers}`);
    console.log(`📊 Total análisis: ${totalAnalyses}`);
    
    // Mostrar usuarios con sus estadísticas
    const usersWithStats = await User.find().select('name email profile stats');
    console.log('\n👥 Usuarios y estadísticas:');
    usersWithStats.forEach(user => {
      console.log(`  ${user.name} (${user.email}):`);
      console.log(`    Nivel: ${user.profile.level}`);
      console.log(`    Análisis: ${user.stats.totalAnalyses}`);
      console.log(`    Puntuación promedio: ${(user.stats.averageScore * 100).toFixed(1)}%`);
      console.log(`    Mejor puntuación: ${(user.stats.bestScore * 100).toFixed(1)}%`);
    });
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar seed si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
