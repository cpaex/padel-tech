const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Validaciones para actualizar perfil
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('profile.level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Nivel inválido'),
  body('profile.favoriteShot')
    .optional()
    .isIn(['derecha', 'reves', 'volea', 'saque', 'bandeja', 'vibora', 'remate'])
    .withMessage('Golpe favorito inválido'),
  body('profile.experience')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La experiencia debe ser un número positivo'),
  body('settings.language')
    .optional()
    .isIn(['es', 'en', 'pt'])
    .withMessage('Idioma inválido')
];

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario
 * @access  Private
 */
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getProfileSummary()
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

/**
 * @route   PUT /api/users/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put('/profile', updateProfileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar campos permitidos
    const updateFields = ['name', 'profile', 'settings'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = { ...user[field], ...req.body[field] };
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: user.getProfileSummary()
      }
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Obtener estadísticas del usuario
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        stats: user.stats,
        calculatedLevel: user.calculatedLevel,
        accountAge: user.accountAge
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
 * @route   PUT /api/users/settings
 * @desc    Actualizar configuraciones del usuario
 * @access  Private
 */
router.put('/settings', [
  body('notifications.email').optional().isBoolean(),
  body('notifications.push').optional().isBoolean(),
  body('notifications.weeklyReport').optional().isBoolean(),
  body('privacy.publicProfile').optional().isBoolean(),
  body('privacy.shareAnalytics').optional().isBoolean(),
  body('language').optional().isIn(['es', 'en', 'pt']),
  body('timezone').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar configuraciones
    if (req.body.notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...req.body.notifications };
    }
    
    if (req.body.privacy) {
      user.settings.privacy = { ...user.settings.privacy, ...req.body.privacy };
    }
    
    if (req.body.language) {
      user.settings.language = req.body.language;
    }
    
    if (req.body.timezone) {
      user.settings.timezone = req.body.timezone;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Configuraciones actualizadas exitosamente',
      data: {
        settings: user.settings
      }
    });

  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   DELETE /api/users/account
 * @desc    Eliminar cuenta del usuario
 * @access  Private
 */
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // En producción, aquí podrías implementar lógica adicional
    // como eliminar archivos, notificar servicios externos, etc.
    
    await user.remove();

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/users/leaderboard
 * @desc    Obtener tabla de líderes
 * @access  Public (con autenticación opcional)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, level } = req.query;
    
    const filter = { isActive: true };
    if (level) {
      filter['profile.level'] = level;
    }

    const users = await User.find(filter)
      .select('name profile.level stats.averageScore stats.totalAnalyses')
      .sort({ 'stats.averageScore': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        leaderboard: users.map(user => ({
          name: user.name,
          level: user.profile.level,
          averageScore: user.stats.averageScore,
          totalAnalyses: user.stats.totalAnalyses
        }))
      }
    });

  } catch (error) {
    console.error('Error obteniendo tabla de líderes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
