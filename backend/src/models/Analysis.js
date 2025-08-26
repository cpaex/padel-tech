const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  // Usuario que realizó el análisis
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Tipo de golpe analizado
  shotType: {
    type: String,
    required: true,
    enum: ['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate'],
    index: true
  },
  
  // Video del golpe
  video: {
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    duration: Number, // en segundos
    size: Number, // en bytes
    format: String,
    quality: String
  },
  
  // Resultados del análisis
  results: {
    overallScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    posture: {
      score: { type: Number, min: 0, max: 100 },
      feedback: [String],
      confidence: { type: Number, min: 0, max: 1 }
    },
    timing: {
      score: { type: Number, min: 0, max: 100 },
      feedback: [String],
      confidence: { type: Number, min: 0, max: 1 }
    },
    followThrough: {
      score: { type: Number, min: 0, max: 100 },
      feedback: [String],
      confidence: { type: Number, min: 0, max: 1 }
    },
    power: {
      score: { type: Number, min: 0, max: 100 },
      feedback: [String],
      confidence: { type: Number, min: 0, max: 1 }
    }
  },
  
  // Mejoras sugeridas
  improvements: [{
    category: {
      type: String,
      enum: ['posture', 'timing', 'followThrough', 'power', 'general']
    },
    description: {
      type: String,
      required: true,
      maxlength: 500
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard'],
      default: 'moderate'
    }
  }],
  
  // Metadatos del análisis
  metadata: {
    device: {
      type: String,
      default: 'mobile'
    },
    location: {
      type: String,
      default: null
    },
    weather: {
      temperature: Number,
      humidity: Number,
      conditions: String
    },
    courtType: {
      type: String,
      enum: ['indoor', 'outdoor', 'clay', 'concrete', 'grass'],
      default: 'outdoor'
    },
    sessionDuration: Number, // en minutos
    shotNumber: Number // número de golpe en la sesión
  },
  
  // Estado del análisis
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'reviewed'],
    default: 'completed'
  },
  
  // Información del modelo de IA
  aiModel: {
    version: String,
    confidence: Number,
    processingTime: Number, // en milisegundos
    modelType: String
  },
  
  // Tags y categorías
  tags: [String],
  
  // Comentarios del usuario
  userNotes: {
    type: String,
    maxlength: 1000
  },
  
  // Comentarios del coach (si aplica)
  coachFeedback: {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    feedback: String,
    rating: Number,
    date: Date
  },
  
  // Comparación con análisis anteriores
  comparison: {
    previousScore: Number,
    improvement: Number, // porcentaje de mejora
    trend: {
      type: String,
      enum: ['improving', 'stable', 'declining']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para calcular la confianza promedio
analysisSchema.virtual('averageConfidence').get(function() {
  const scores = [
    this.results.posture?.confidence,
    this.results.timing?.confidence,
    this.results.followThrough?.confidence,
    this.results.power?.confidence
  ].filter(score => score !== undefined);
  
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
});

// Virtual para obtener el nivel de dificultad del golpe
analysisSchema.virtual('shotDifficulty').get(function() {
  const difficulties = {
    'derecha': 'easy',
    'reves': 'moderate',
    'volea': 'easy',
    'saque': 'hard',
    'bandeja': 'moderate',
    'vibora': 'hard',
    'remate': 'hard'
  };
  return difficulties[this.shotType] || 'moderate';
});

// Método para calcular tendencia de mejora
analysisSchema.methods.calculateTrend = function(previousAnalyses) {
  if (previousAnalyses.length === 0) return 'stable';
  
  const recentScores = previousAnalyses
    .slice(-3)
    .map(analysis => analysis.results.overallScore);
  
  if (recentScores.length < 3) return 'stable';
  
  const firstScore = recentScores[0];
  const lastScore = recentScores[recentScores.length - 1];
  
  if (lastScore > firstScore + 5) return 'improving';
  if (lastScore < firstScore - 5) return 'declining';
  return 'stable';
};

// Método para obtener resumen del análisis
analysisSchema.methods.getSummary = function() {
  return {
    id: this._id,
    shotType: this.shotType,
    overallScore: this.results.overallScore,
    improvements: this.improvements,
    status: this.status,
    createdAt: this.createdAt,
    videoUrl: this.video.url,
    thumbnail: this.video.thumbnail
  };
};

// Método para obtener estadísticas detalladas
analysisSchema.methods.getDetailedStats = function() {
  return {
    overallScore: this.results.overallScore,
    posture: this.results.posture,
    timing: this.results.timing,
    followThrough: this.results.followThrough,
    power: this.results.power,
    averageConfidence: this.averageConfidence,
    shotDifficulty: this.shotDifficulty,
    improvements: this.improvements,
    comparison: this.comparison
  };
};

// Índices para optimizar consultas
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ shotType: 1, 'results.overallScore': -1 });
analysisSchema.index({ status: 1 });
analysisSchema.index({ 'metadata.courtType': 1 });
analysisSchema.index({ tags: 1 });

// Middleware para actualizar estadísticas del usuario
analysisSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(
      doc.userId,
      { $inc: { 'stats.totalAnalyses': 1 } }
    );
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;
