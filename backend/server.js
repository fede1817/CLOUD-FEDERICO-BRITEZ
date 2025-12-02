import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads";
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 500 * 1024 * 1024; // 500MB por defecto

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use("/uploads", express.static(UPLOAD_PATH));

// Crear carpeta uploads si no existe
const ensureUploadsDir = async () => {
  try {
    await fs.ensureDir(UPLOAD_PATH);
    console.log(`📁 Carpeta de uploads verificada: ${UPLOAD_PATH}`);
  } catch (error) {
    console.error("❌ Error creando carpeta uploads:", error);
  }
};

// Configuración de almacenamiento con Multer - PERMITIR CUALQUIER TIPO
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    // Mantener el nombre original pero sanitizado
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}-${originalName}`;
    cb(null, uniqueName);
  },
});

// Configuración de Multer - ACEPTAR CUALQUIER ARCHIVO
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(MAX_FILE_SIZE),
    files: 50, // Máximo 50 archivos por petición
  },
  // Eliminamos fileFilter para permitir cualquier tipo de archivo
});

// Middleware de manejo de errores de Multer
const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: `Archivo demasiado grande. Límite: ${
          MAX_FILE_SIZE / 1024 / 1024
        }MB`,
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Demasiados archivos. Máximo 50 por petición",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: "Campo de archivo inesperado",
      });
    }
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next();
};

// Clasificar tipo de archivo (mejorado)
const classifyFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();

  // Imágenes
  if (
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".bmp",
      ".tiff",
      ".svg",
      ".ico",
      ".heic",
    ].includes(ext)
  ) {
    return "image";
  }
  // Videos
  else if (
    [
      ".mp4",
      ".avi",
      ".mov",
      ".mkv",
      ".webm",
      ".flv",
      ".wmv",
      ".m4v",
      ".3gp",
      ".mpeg",
      ".mpg",
    ].includes(ext)
  ) {
    return "video";
  }
  // Audio
  else if (
    [".mp3", ".wav", ".ogg", ".aac", ".flac", ".m4a", ".wma", ".aiff"].includes(
      ext
    )
  ) {
    return "audio";
  }
  // Documentos
  else if (
    [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
      ".rtf",
      ".csv",
      ".odt",
      ".ods",
    ].includes(ext)
  ) {
    return "document";
  }
  // Archivos comprimidos
  else if (
    [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".dmg", ".iso"].includes(ext)
  ) {
    return "archive";
  }
  // Ejecutables y programas
  else if (
    [".exe", ".msi", ".dmg", ".pkg", ".deb", ".rpm", ".apk"].includes(ext)
  ) {
    return "executable";
  }
  // Código fuente
  else if (
    [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".html",
      ".css",
      ".scss",
      ".php",
      ".py",
      ".java",
      ".c",
      ".cpp",
      ".json",
      ".xml",
    ].includes(ext)
  ) {
    return "code";
  }
  // Fuentes
  else if ([".ttf", ".otf", ".woff", ".woff2", ".eot"].includes(ext)) {
    return "font";
  }
  // Base de datos
  else if ([".sql", ".db", ".sqlite", ".mdb"].includes(ext)) {
    return "database";
  } else {
    return "other";
  }
};

// Función para obtener icono según tipo
const getFileIcon = (filename, type) => {
  const ext = path.extname(filename).toLowerCase();

  switch (type) {
    case "image":
      return "far fa-file-image text-green-500";
    case "video":
      return "far fa-file-video text-red-500";
    case "audio":
      return "far fa-file-audio text-purple-500";
    case "document":
      if (ext === ".pdf") return "far fa-file-pdf text-red-500";
      if ([".doc", ".docx"]) return "far fa-file-word text-blue-500";
      if ([".xls", ".xlsx"]) return "far fa-file-excel text-green-600";
      if ([".ppt", ".pptx"]) return "far fa-file-powerpoint text-orange-500";
      return "far fa-file-alt text-blue-400";
    case "archive":
      return "far fa-file-archive text-yellow-500";
    case "executable":
      return "fas fa-cog text-gray-500";
    case "code":
      return "far fa-file-code text-indigo-500";
    case "font":
      return "fas fa-font text-pink-500";
    case "database":
      return "fas fa-database text-teal-500";
    default:
      return "far fa-file text-gray-500";
  }
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Servidor de archivos funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    features: "Todos los tipos de archivo permitidos",
  });
});

// Obtener información del servidor
app.get("/api/info", async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_PATH);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_PATH, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    res.json({
      success: true,
      data: {
        totalFiles: files.length,
        totalSize: totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        uploadPath: UPLOAD_PATH,
        maxFileSize: MAX_FILE_SIZE,
        maxFileSizeFormatted: formatFileSize(MAX_FILE_SIZE),
        allowedFileTypes: "Todos los tipos de archivo",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error obteniendo información del servidor",
    });
  }
});

// Listar archivos
app.get("/api/files", async (req, res) => {
  try {
    const { type, page = 1, limit = 100 } = req.query;
    const files = await fs.readdir(UPLOAD_PATH);

    let fileList = [];

    for (const file of files) {
      const filePath = path.join(UPLOAD_PATH, file);
      const stats = await fs.stat(filePath);

      const fileType = classifyFileType(file);

      // Filtrar por tipo si se especifica
      if (type && fileType !== type) {
        continue;
      }

      fileList.push({
        name: file,
        originalName: file.includes("-")
          ? file.split("-").slice(2).join("-")
          : file,
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        uploadDate: stats.mtime,
        type: fileType,
        url: `${getBaseUrl(req)}/uploads/${file}`,
        extension: path.extname(file).toLowerCase(),
        icon: getFileIcon(file, fileType),
      });
    }

    // Ordenar por fecha de modificación (más reciente primero)
    fileList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFiles = fileList.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        files: paginatedFiles,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(fileList.length / limit),
          totalFiles: fileList.length,
          hasNext: endIndex < fileList.length,
          hasPrev: startIndex > 0,
        },
      },
    });
  } catch (error) {
    console.error("Error listando archivos:", error);
    res.status(500).json({
      success: false,
      error: "Error leyendo archivos del servidor",
    });
  }
});

// Subir archivos
app.post(
  "/api/upload",
  upload.array("files", 50),
  handleUploadErrors,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No se subieron archivos",
        });
      }

      const uploadedFiles = req.files.map((file) => {
        const fileType = classifyFileType(file.originalname);
        return {
          name: file.filename,
          originalName: file.originalname,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          type: fileType,
          url: `${getBaseUrl(req)}/uploads/${file.filename}`,
          extension: path.extname(file.originalname).toLowerCase(),
          icon: getFileIcon(file.originalname, fileType),
        };
      });

      console.log(
        `✅ ${uploadedFiles.length} archivo(s) subido(s) exitosamente`
      );

      res.json({
        success: true,
        message: `Archivos subidos exitosamente (${uploadedFiles.length})`,
        data: {
          files: uploadedFiles,
          totalSize: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
          totalSizeFormatted: formatFileSize(
            uploadedFiles.reduce((sum, file) => sum + file.size, 0)
          ),
        },
      });
    } catch (error) {
      console.error("Error subiendo archivos:", error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor al subir archivos",
      });
    }
  }
);

// *** IMPORTANTE: El orden de las rutas DELETE es crucial ***
// Primero la ruta de eliminación masiva (antes de la individual)
app.delete("/api/files/batch", async (req, res) => {
  try {
    const { filenames } = req.body;

    console.log("📦 Eliminación masiva solicitada para:", filenames);

    // Validar que se proporcionó un array de nombres de archivo
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar un array de nombres de archivo",
      });
    }

    // Validar cada nombre de archivo por seguridad
    for (const filename of filenames) {
      if (
        filename.includes("..") ||
        filename.includes("/") ||
        filename.includes("\\")
      ) {
        return res.status(400).json({
          success: false,
          error: `Nombre de archivo inválido: ${filename}`,
        });
      }
    }

    const results = {
      success: [],
      failed: [],
      total: filenames.length,
    };

    // Eliminar cada archivo
    for (const filename of filenames) {
      try {
        const filePath = path.join(UPLOAD_PATH, filename);

        // Verificar si el archivo existe
        if (await fs.pathExists(filePath)) {
          await fs.unlink(filePath);
          results.success.push(filename);
          console.log(`✅ Archivo eliminado: ${filename}`);
        } else {
          results.failed.push({
            filename,
            reason: "Archivo no encontrado",
          });
        }
      } catch (error) {
        results.failed.push({
          filename,
          reason: error.message,
        });
        console.error(`❌ Error eliminando ${filename}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Eliminación masiva completada. Éxitos: ${results.success.length}, Fallidos: ${results.failed.length}`,
      data: results,
    });
  } catch (error) {
    console.error("Error en eliminación masiva:", error);
    res.status(500).json({
      success: false,
      error: "Error eliminando archivos masivamente",
    });
  }
});

// Luego la ruta de eliminación individual
app.delete("/api/files/:filename", async (req, res) => {
  try {
    const { filename } = req.params;

    console.log("🗑️ Eliminación individual solicitada para:", filename);

    // Validar nombre de archivo por seguridad
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({
        success: false,
        error: "Nombre de archivo inválido",
      });
    }

    const filePath = path.join(UPLOAD_PATH, filename);

    // Verificar si el archivo existe
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({
        success: false,
        error: "Archivo no encontrado",
      });
    }

    // Eliminar el archivo
    await fs.unlink(filePath);
    console.log(`✅ Archivo eliminado: ${filename}`);

    res.json({
      success: true,
      message: "Archivo eliminado correctamente",
      data: {
        filename: filename,
      },
    });
  } catch (error) {
    console.error("Error eliminando archivo:", error);
    res.status(500).json({
      success: false,
      error: "Error eliminando el archivo",
    });
  }
});

// Función para formatear tamaño de archivo
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Función para obtener la URL base
function getBaseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

// Iniciar servidor
app.listen(PORT, async () => {
  await ensureUploadsDir();
  console.log(`🚀 Servidor de archivos corriendo en: http://localhost:${PORT}`);
  console.log(`📁 Archivos servidos desde: ${UPLOAD_PATH}`);
  console.log(
    `📊 Límite de tamaño por archivo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
  );
  console.log(`✅ TODOS los tipos de archivo permitidos`);
  console.log(`⏰ Iniciado en: ${new Date().toLocaleString()}`);
  console.log(`🔧 Rutas disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/info`);
  console.log(`   GET  /api/files`);
  console.log(`   POST /api/upload`);
  console.log(`   DELETE /api/files/batch (eliminación masiva)`);
  console.log(`   DELETE /api/files/:filename (eliminación individual)`);
});
