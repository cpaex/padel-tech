const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Información básica
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // Perfil de usuario
  profile: {
    avatar: {
      type: String,
      default: null
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    experience: {
      type: Number, // años de experiencia
      default: 0,
      min: 0
    },
    favoriteShot: {
      type: String,
      enum: ['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate'],
      default: 'derecha'
    },
    goals: [{
      type: String,
      maxlength: 200
    }],
    coach: {
      name: String,
      contact: String
    }
  },
  
  // Estadísticas del usuario
  stats: {
    totalAnalyses: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    bestScore: {
      type: Number,
      default: 0
    },
    totalPracticeTime: {
      type: Number, // en minutos
      default: 0
    },
    lastPracticeDate: {
      type: Date,
      default: null
    },
    improvementRate: {
      type: Number, // porcentaje de mejora
      default: 0
    }
  },
  
  // Configuraciones
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true }
    },
    privacy: {
      publicProfile: { type: Boolean, default: false },
      shareAnalytics: { type: Boolean, default: true }
    },
    language: {
      type: String,
      enum: ['es', 'en', 'pt'],
      default: 'es'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Metadatos
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular edad de la cuenta
userSchema.virtual('accountAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual para calcular nivel basado en puntuación promedio
userSchema.virtual('calculatedLevel').get(function() {
  const avg = this.stats.averageScore;
  if (avg >= 90) return 'expert';
  if (avg >= 80) return 'advanced';
  if (avg >= 70) return 'intermediate';
  return 'beginner';
});

// Middleware para hashear password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para actualizar estadísticas
userSchema.methods.updateStats = function(analysisScore) {
  this.stats.totalAnalyses += 1;
  
  // Calcular nuevo promedio
  const totalScore = this.stats.averageScore * (this.stats.totalAnalyses - 1) + analysisScore;
  this.stats.averageScore = totalScore / this.stats.totalAnalyses;
  
  // Actualizar mejor puntuación
  if (analysisScore > this.stats.bestScore) {
    this.stats.bestScore = analysisScore;
  }
  
  // Actualizar fecha de última práctica
  this.stats.lastPracticeDate = new Date();
  
  return this.save();
};

// Método para obtener resumen del perfil
userSchema.methods.getProfileSummary = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    level: this.profile.level,
    experience: this.profile.experience,
    favoriteShot: this.profile.favoriteShot,
    stats: {
      totalAnalyses: this.stats.totalAnalyses,
      averageScore: Math.round(this.stats.averageScore * 100) / 100,
      bestScore: this.stats.bestScore,
      improvementRate: this.stats.improvementRate
    },
    accountAge: this.accountAge,
    lastLogin: this.lastLogin
  };
};

// Índices para optimizar consultas
userSchema.index({ email: 1 });
userSchema.index({ 'profile.level': 1 });
userSchema.index({ 'stats.averageScore': -1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
