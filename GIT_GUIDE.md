# 🚀 Guía de Git para PadelTech

## 📋 **¿Qué archivos SÍ subir a Git?**

### **✅ Código Fuente**
- `src/` - Todo el código fuente
- `*.js`, `*.ts`, `*.jsx`, `*.tsx` - Archivos de código
- `*.json` - Archivos de configuración (excepto .env)
- `*.md` - Documentación
- `*.yml`, `*.yaml` - Archivos de configuración

### **✅ Configuración del Proyecto**
- `package.json` - Dependencias del proyecto
- `README.md` - Documentación principal
- `.gitignore` - Archivos a ignorar
- `env.example` - Plantilla de variables de entorno
- `tsconfig.json` - Configuración de TypeScript
- `metro.config.js` - Configuración de Metro
- `webpack.config.js` - Configuración de Webpack

### **✅ Scripts y Herramientas**
- `start-db.sh` - Scripts de inicio
- `setup.sh` - Scripts de configuración
- `*.sh` - Scripts de shell

### **✅ Documentación**
- `README.md`
- `README-DB.md`
- `GIT_GUIDE.md`
- `docs/` - Documentación adicional

## 🚫 **¿Qué archivos NO subir a Git?**

### **❌ Archivos de Dependencias**
```
node_modules/          # Dependencias instaladas
package-lock.json      # Lock file (opcional)
```

### **❌ Archivos de Configuración Local**
```
.env                   # Variables de entorno (SECRETOS!)
.env.local
.env.development
.env.production
.env.backup
.env.memory
.env.temp
```

### **❌ Archivos de Build y Cache**
```
.expo/                 # Cache de Expo
dist/                  # Archivos compilados
build/                 # Build outputs
web-build/             # Build web
.cache/                # Cache del sistema
```

### **❌ Archivos de Base de Datos**
```
*.db                   # Archivos de base de datos
uploads/               # Archivos subidos por usuarios
logs/                  # Archivos de log
temp/                  # Archivos temporales
```

### **❌ Archivos de Sistema**
```
.DS_Store              # macOS
Thumbs.db              # Windows
.vscode/               # Configuración de VS Code
.idea/                 # Configuración de IntelliJ
```

### **❌ Archivos de Seguridad**
```
*.pem                  # Certificados SSL
*.key                  # Claves privadas
secrets/               # Directorio de secretos
keys/                  # Claves de API
```

## 🔐 **Archivos Críticos de Seguridad**

### **🚨 NUNCA subir estos archivos:**
- `.env` - Contiene secretos de la aplicación
- `*.pem` - Certificados SSL
- `*.key` - Claves privadas
- `secrets.json` - Configuración de secretos
- `config/production.json` - Configuración de producción

### **✅ SÍ subir estos archivos:**
- `env.example` - Plantilla de variables de entorno
- `config/default.json` - Configuración por defecto
- `config/development.json` - Configuración de desarrollo

## 📝 **Comandos Git Útiles**

### **Verificar qué archivos se van a subir:**
```bash
git status
git add -n .           # Simular add sin hacerlo
git diff --cached      # Ver cambios preparados
```

### **Agregar archivos específicos:**
```bash
git add src/           # Solo código fuente
git add *.md           # Solo documentación
git add *.json         # Solo archivos de configuración
git add *.sh           # Solo scripts
```

### **Ignorar archivos ya trackeados:**
```bash
git rm --cached .env   # Remover .env del tracking
git rm --cached -r node_modules/  # Remover node_modules
```

## 🎯 **Flujo de Trabajo Recomendado**

### **1. Configuración Inicial:**
```bash
# Copiar plantilla de variables de entorno
cp env.example .env

# Editar .env con valores reales
nano .env

# Verificar que .env esté en .gitignore
git status
```

### **2. Antes de cada Commit:**
```bash
# Verificar qué se va a subir
git status

# Verificar que no haya archivos sensibles
git diff --cached

# Si todo está bien, hacer commit
git add .
git commit -m "Descripción del cambio"
```

### **3. Antes de Push:**
```bash
# Verificar que no haya secretos en el código
grep -r "password\|secret\|key" src/ --exclude-dir=node_modules

# Si todo está bien, hacer push
git push origin main
```

## 🔍 **Verificación de Seguridad**

### **Buscar posibles secretos en el código:**
```bash
# Buscar contraseñas hardcodeadas
grep -r "password.*=" src/
grep -r "secret.*=" src/
grep -r "key.*=" src/

# Buscar URLs de base de datos
grep -r "mongodb://" src/
grep -r "postgresql://" src/

# Buscar tokens de API
grep -r "api_key\|token" src/
```

### **Verificar archivos que se van a subir:**
```bash
# Ver todos los archivos trackeados
git ls-files

# Ver archivos que se van a subir
git diff --cached --name-only

# Ver archivos ignorados
git status --ignored
```

## 📚 **Recursos Adicionales**

- [GitHub Security Best Practices](https://docs.github.com/en/github/security)
- [OWASP Security Guidelines](https://owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## ⚠️ **Recordatorio Importante**

**Si accidentalmente subes un archivo con secretos:**

1. **Inmediatamente**: Cambia todas las claves/secretos
2. **Remueve del historial**: `git filter-branch` o `BFG Repo-Cleaner`
3. **Notifica al equipo**: Para que cambien sus credenciales
4. **Revisa logs**: Para detectar uso no autorizado

---

**¡La seguridad es responsabilidad de todos! 🛡️**
