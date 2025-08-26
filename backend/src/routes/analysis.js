const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Analysis = require('../models/Analysis');
const User = require('../models/User');

const router = express.Router();

// Validaciones para crear análisis
const createAnalysisValidation = [
  body('shotType')
    .isIn(['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate'])
    .withMessage('Tipo de golpe inválido'),
  body('results.overallScore')
    .isInt({ min: 0, max: 100 })
    .withMessage('Puntuación debe estar entre 0 y 100'),
  body('video.url')
    .notEmpty()
    .withMessage('URL del video es requerida'),
  body('improvements')
    .isArray()
    .withMessage('Mejoras debe ser un array')
];

// Validaciones para actualizar análisis
const updateAnalysisValidation = [
  body('results.overallScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Puntuación debe estar entre 0 y 100'),
  body('status')
    .optional()
    .isIn(['processing', 'completed', 'failed', 'reviewed'])
    .withMessage('Estado inválido')
];

/**
 * @route   POST /api/analysis
 * @desc    Crear nuevo análisis
 * @access  Private
 */
router.post('/', createAnalysisValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      shotType,
      results,
      video,
      improvements,
      metadata,
      userNotes
    } = req.body;

    // Crear nuevo análisis
    const analysis = new Analysis({
      userId: req.user.userId,
      shotType,
      results,
      video,
      improvements: improvements || [],
      metadata: metadata || {},
      userNotes
    });

    // Calcular tendencia si hay análisis anteriores
    const previousAnalyses = await Analysis.find({
      userId: req.user.userId,
      shotType
    }).sort({ createdAt: -1 }).limit(3);

    if (previousAnalyses.length > 0) {
      const previousScore = previousAnalyses[0].results.overallScore;
      const improvement = ((results.overallScore - previousScore) / previousScore) * 100;
      
      analysis.comparison = {
        previousScore,
        improvement: Math.round(improvement * 100) / 100,
        trend: analysis.calculateTrend(previousAnalyses)
      };
    }

    await analysis.save();

    // Actualizar estadísticas del usuario
    const user = await User.findById(req.user.userId);
    if (user) {
      await user.updateStats(results.overallScore);
    }

    res.status(201).json({
      success: true,
      message: 'Análisis creado exitosamente',
      data: {
        analysis: analysis.getSummary()
      }
    });

  } catch (error) {
    console.error('Error creando análisis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/analysis
 * @desc    Obtener análisis del usuario
 * @access  Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100'),
  query('shotType').optional().isIn(['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate']),
  query('status').optional().isIn(['processing', 'completed', 'failed', 'reviewed']),
  query('sortBy').optional().isIn(['createdAt', 'overallScore', 'shotType']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      shotType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = { userId: req.user.userId };
    if (shotType) filters.shotType = shotType;
    if (status) filters.status = status;

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consulta
    const analyses = await Analysis.find(filters)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('userId', 'name email');

    // Contar total de documentos
    const total = await Analysis.countDocuments(filters);

    // Calcular estadísticas
    const stats = await Analysis.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          averageScore: { $avg: '$results.overallScore' },
          bestScore: { $max: '$results.overallScore' },
          shotTypeCounts: {
            $push: '$shotType'
          }
        }
      }
    ]);

    // Procesar estadísticas
    const shotTypeStats = {};
    if (stats.length > 0) {
      const shotTypes = stats[0].shotTypeCounts;
      shotTypes.forEach(type => {
        shotTypeStats[type] = (shotTypeStats[type] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        analyses: analyses.map(analysis => analysis.getSummary()),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: {
          totalAnalyses: stats.length > 0 ? stats[0].totalAnalyses : 0,
          averageScore: stats.length > 0 ? Math.round(stats[0].averageScore * 100) / 100 : 0,
          bestScore: stats.length > 0 ? stats[0].bestScore : 0,
          shotTypeDistribution: shotTypeStats
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

/**
 * @route   GET /api/analysis/:id
 * @desc    Obtener análisis específico
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.userId
    }).populate('userId', 'name email');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Análisis no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        analysis: analysis.getDetailedStats()
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

/**
 * @route   PUT /api/analysis/:id
 * @desc    Actualizar análisis
 * @access  Private
 */
router.put('/:id', updateAnalysisValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Análisis no encontrado'
      });
    }

    // Actualizar campos permitidos
    const updateFields = ['results', 'improvements', 'status', 'userNotes', 'tags'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        analysis[field] = req.body[field];
      }
    });

    await analysis.save();

    res.json({
      success: true,
      message: 'Análisis actualizado exitosamente',
      data: {
        analysis: analysis.getSummary()
      }
    });

  } catch (error) {
    console.error('Error actualizando análisis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   DELETE /api/analysis/:id
 * @desc    Eliminar análisis
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Análisis no encontrado'
      });
    }

    await analysis.remove();

    res.json({
      success: true,
      message: 'Análisis eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando análisis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/analysis/stats/summary
 * @desc    Obtener resumen de estadísticas
 * @access  Private
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Analysis.aggregate([
      { $match: { userId: req.user.userId } },
      {
        $group: {
          _id: '$shotType',
          count: { $sum: 1 },
          averageScore: { $avg: '$results.overallScore' },
          bestScore: { $max: '$results.overallScore' },
          recentScores: {
            $push: {
              score: '$results.overallScore',
              date: '$createdAt'
            }
          }
        }
      },
      {
        $project: {
          shotType: '$_id',
          count: 1,
          averageScore: { $round: ['$averageScore', 2] },
          bestScore: 1,
          recentScores: { $slice: ['$recentScores', -5] }
        }
      }
    ]);

    // Calcular tendencia general
    const recentAnalyses = await Analysis.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);

    let trend = 'stable';
    if (recentAnalyses.length >= 3) {
      const firstScore = recentAnalyses[recentAnalyses.length - 1].results.overallScore;
      const lastScore = recentAnalyses[0].results.overallScore;
      
      if (lastScore > firstScore + 5) trend = 'improving';
      else if (lastScore < firstScore - 5) trend = 'declining';
    }

    res.json({
      success: true,
      data: {
        shotTypeStats: stats,
        overallTrend: trend,
        totalAnalyses: recentAnalyses.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/analysis/stats/progress
 * @desc    Obtener progreso del usuario
 * @access  Private
 */
router.get('/stats/progress', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Período inválido')
], async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calcular fecha de inicio según período
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const progress = await Analysis.aggregate([
      {
        $match: {
          userId: req.user.userId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: period === 'week' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          averageScore: { $avg: '$results.overallScore' },
          totalScore: { $sum: '$results.overallScore' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        progress: progress.map(p => ({
          period: p._id,
          count: p.count,
          averageScore: Math.round(p.averageScore * 100) / 100,
          totalScore: p.totalScore
        }))
      }
    });

  } catch (error) {
    console.error('Error obteniendo progreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
