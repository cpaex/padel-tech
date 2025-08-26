const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');

const router = express.Router();

// Configuración de multer para upload de videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `video-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFormats = (process.env.ALLOWED_VIDEO_FORMATS || 'mp4,mov,avi,mkv').split(',');
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedFormats.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Formato de video no permitido. Formatos permitidos: ${allowedFormats.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB por defecto
  }
});

/**
 * @route   POST /api/videos/upload
 * @desc    Subir video
 * @access  Private
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo de video'
      });
    }

    const videoInfo = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      userId: req.user.userId,
      uploadedAt: new Date()
    };

    // Generar thumbnail del video (primer frame)
    const thumbnailPath = req.file.path.replace(path.extname(req.file.filename), '_thumb.jpg');
    
    try {
      // En producción, usar ffmpeg para extraer el primer frame
      // Por ahora, creamos un thumbnail placeholder
      await sharp({
        create: {
          width: 320,
          height: 240,
          channels: 3,
          background: { r: 100, g: 100, b: 100 }
        }
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
      
      videoInfo.thumbnail = thumbnailPath;
    } catch (thumbnailError) {
      console.warn('No se pudo generar thumbnail:', thumbnailError.message);
    }

    res.json({
      success: true,
      message: 'Video subido exitosamente',
      data: {
        video: {
          id: videoInfo.filename,
          originalName: videoInfo.originalName,
          size: videoInfo.size,
          thumbnail: videoInfo.thumbnail,
          uploadedAt: videoInfo.uploadedAt
        }
      }
    });

  } catch (error) {
    console.error('Error subiendo video:', error);
    
    // Limpiar archivo si hubo error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error limpiando archivo:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/videos/:id
 * @desc    Obtener video por ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const videoPath = path.join(uploadPath, videoId);

    // Verificar que el archivo existe
    try {
      await fs.access(videoPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado'
      });
    }

    // Obtener información del archivo
    const stats = await fs.stat(videoPath);
    const ext = path.extname(videoId).toLowerCase();

    res.json({
      success: true,
      data: {
        video: {
          id: videoId,
          path: videoPath,
          size: stats.size,
          uploadedAt: stats.birthtime,
          format: ext.substring(1)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo video:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   DELETE /api/videos/:id
 * @desc    Eliminar video
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const videoPath = path.join(uploadPath, videoId);
    const thumbnailPath = videoPath.replace(path.extname(videoId), '_thumb.jpg');

    // Verificar que el archivo existe
    try {
      await fs.access(videoPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado'
      });
    }

    // Eliminar video y thumbnail
    await fs.unlink(videoPath);
    
    try {
      await fs.unlink(thumbnailPath);
    } catch (thumbnailError) {
      // El thumbnail puede no existir
      console.warn('No se pudo eliminar thumbnail:', thumbnailError.message);
    }

    res.json({
      success: true,
      message: 'Video eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando video:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   POST /api/videos/:id/thumbnail
 * @desc    Generar thumbnail del video
 * @access  Private
 */
router.post('/:id/thumbnail', async (req, res) => {
  try {
    const videoId = req.params.id;
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const videoPath = path.join(uploadPath, videoId);
    const thumbnailPath = videoPath.replace(path.extname(videoId), '_thumb.jpg');

    // Verificar que el video existe
    try {
      await fs.access(videoPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado'
      });
    }

    // En producción, usar ffmpeg para extraer el primer frame
    // Por ahora, creamos un thumbnail placeholder
    await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 100, g: 100, b: 100 }
      }
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

    res.json({
      success: true,
      message: 'Thumbnail generado exitosamente',
      data: {
        thumbnail: thumbnailPath
      }
    });

  } catch (error) {
    console.error('Error generando thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * @route   GET /api/videos/user/:userId
 * @desc    Obtener videos de un usuario específico
 * @access  Private
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // En una implementación real, tendrías una colección de videos en MongoDB
    // Por ahora, simulamos la respuesta
    res.json({
      success: true,
      data: {
        videos: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo videos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
