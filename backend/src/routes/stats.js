const express = require('express');
const { query, validationResult } = require('express-validator');
const Analysis = require('../models/Analysis');
const User = require('../models/User');

const router = express.Router();

// Validaciones para consultas de estadísticas
const statsValidation = [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Período inválido'),
  query('shotType').optional().isIn(['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate']).withMessage('Tipo de golpe inválido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
];

/**
 * @route   GET /api/stats/overview
 * @desc    Obtener vista general de estadísticas
 * @access  Private
 */
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Estadísticas generales del usuario
    const userStats = await User.findById(userId).select('stats profile');
    
    // Estadísticas de análisis por tipo de golpe
    const shotTypeStats = await Analysis.aggregate([
      { $match: { userId: userId } },
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

    // Tendencias de mejora
    const recentAnalyses = await Analysis.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    let overallTrend = 'stable';
    if (recentAnalyses.length >= 3) {
      const firstScore = recentAnalyses[recentAnalyses.length - 1].results.overallScore;
      const lastScore = recentAnalyses[0].results.overallScore;
      
      if (lastScore > firstScore + 5) overallTrend = 'improving';
      else if (lastScore < firstScore - 5) overallTrend = 'declining';
    }

    res.json({
      success: true,
      data: {
        userStats: userStats?.stats || {},
        shotTypeStats: shotTypeStats,
        overallTrend: overallTrend,
        totalAnalyses: recentAnalyses.length,
        lastAnalysis: recentAnalyses[0] ? recentAnalyses[0].createdAt : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas generales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/stats/performance
 * @desc    Obtener estadísticas de rendimiento detalladas
 * @access  Private
 */
router.get('/performance', statsValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { period = 'month', shotType, limit = 20 } = req.query;
    const userId = req.user.userId;
    
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

    // Construir filtros
    const filters = { 
      userId: userId,
      createdAt: { $gte: startDate }
    };
    
    if (shotType) {
      filters.shotType = shotType;
    }

    // Estadísticas de rendimiento por período
    const performanceStats = await Analysis.aggregate([
      { $match: filters },
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
          totalScore: { $sum: '$results.overallScore' },
          bestScore: { $max: '$results.overallScore' },
          worstScore: { $min: '$results.overallScore' }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Estadísticas de aspectos técnicos
    const technicalStats = await Analysis.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          avgPosture: { $avg: '$results.posture.score' },
          avgTiming: { $avg: '$results.timing.score' },
          avgFollowThrough: { $avg: '$results.followThrough.score' },
          avgPower: { $avg: '$results.power.score' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        startDate,
        performanceStats: performanceStats.map(p => ({
          period: p._id,
          count: p.count,
          averageScore: Math.round(p.averageScore * 100) / 100,
          totalScore: p.totalScore,
          bestScore: p.bestScore,
          worstScore: p.worstScore
        })),
        technicalStats: technicalStats.length > 0 ? {
          averagePosture: Math.round(technicalStats[0].avgPosture * 100) / 100,
          averageTiming: Math.round(technicalStats[0].avgTiming * 100) / 100,
          averageFollowThrough: Math.round(technicalStats[0].avgFollowThrough * 100) / 100,
          averagePower: Math.round(technicalStats[0].avgPower * 100) / 100
        } : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de rendimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/stats/comparison
 * @desc    Obtener comparaciones y análisis de tendencias
 * @access  Private
 */
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { shotType, compareWith = 'previous' } = req.query;

    // Construir filtros
    const filters = { userId: userId };
    if (shotType) {
      filters.shotType = shotType;
    }

    // Obtener análisis recientes
    const recentAnalyses = await Analysis.find(filters)
      .sort({ createdAt: -1 })
      .limit(20);

    if (recentAnalyses.length < 2) {
      return res.json({
        success: true,
        data: {
          message: 'Se necesitan al menos 2 análisis para comparar',
          comparison: null
        }
      });
    }

    // Calcular comparaciones
    const currentPeriod = recentAnalyses.slice(0, 5);
    const previousPeriod = recentAnalyses.slice(5, 10);

    const currentAvg = currentPeriod.reduce((sum, a) => sum + a.results.overallScore, 0) / currentPeriod.length;
    const previousAvg = previousPeriod.reduce((sum, a) => sum + a.results.overallScore, 0) / previousPeriod.length;

    const improvement = ((currentAvg - previousAvg) / previousAvg) * 100;
    const trend = improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable';

    // Comparación por aspectos técnicos
    const technicalComparison = {
      posture: {
        current: currentPeriod.reduce((sum, a) => sum + (a.results.posture?.score || 0), 0) / currentPeriod.length,
        previous: previousPeriod.reduce((sum, a) => sum + (a.results.posture?.score || 0), 0) / previousPeriod.length
      },
      timing: {
        current: currentPeriod.reduce((sum, a) => sum + (a.results.timing?.score || 0), 0) / currentPeriod.length,
        previous: previousPeriod.reduce((sum, a) => sum + (a.results.timing?.score || 0), 0) / previousPeriod.length
      },
      followThrough: {
        current: currentPeriod.reduce((sum, a) => sum + (a.results.followThrough?.score || 0), 0) / currentPeriod.length,
        previous: previousPeriod.reduce((sum, a) => sum + (a.results.followThrough?.score || 0), 0) / previousPeriod.length
      },
      power: {
        current: currentPeriod.reduce((sum, a) => sum + (a.results.power?.score || 0), 0) / currentPeriod.length,
        previous: previousPeriod.reduce((sum, a) => sum + (a.results.power?.score || 0), 0) / previousPeriod.length
      }
    };

    res.json({
      success: true,
      data: {
        comparison: {
          overallScore: {
            current: Math.round(currentAvg * 100) / 100,
            previous: Math.round(previousAvg * 100) / 100,
            improvement: Math.round(improvement * 100) / 100,
            trend
          },
          technicalAspects: technicalComparison,
          period: {
            current: currentPeriod.length,
            previous: previousPeriod.length
          }
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo comparaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/stats/export
 * @desc    Exportar datos de estadísticas
 * @access  Private
 */
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format = 'json', period = 'all' } = req.query;

    // Construir filtros según período
    let filters = { userId: userId };
    if (period !== 'all') {
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
      }
      
      if (startDate) {
        filters.createdAt = { $gte: startDate };
      }
    }

    // Obtener datos para exportar
    const analyses = await Analysis.find(filters)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    const user = await User.findById(userId).select('name email profile stats');

    const exportData = {
      user: user,
      analyses: analyses,
      exportDate: new Date().toISOString(),
      period: period,
      totalAnalyses: analyses.length
    };

    if (format === 'csv') {
      // Implementar exportación a CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=padeltech-stats-${period}-${Date.now()}.csv`);
      
      // CSV header
      let csv = 'Date,Shot Type,Overall Score,Posture,Timing,Follow Through,Power\n';
      
      analyses.forEach(analysis => {
        csv += `${analysis.createdAt.toISOString()},${analysis.shotType},${analysis.results.overallScore},${analysis.results.posture?.score || 'N/A'},${analysis.results.timing?.score || 'N/A'},${analysis.results.followThrough?.score || 'N/A'},${analysis.results.power?.score || 'N/A'}\n`;
      });
      
      res.send(csv);
    } else {
      // Exportación JSON por defecto
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=padeltech-stats-${period}-${Date.now()}.json`);
      res.json(exportData);
    }

  } catch (error) {
    console.error('Error exportando estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
