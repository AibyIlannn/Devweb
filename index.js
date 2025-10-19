#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');
const os = require('os');
const crypto = require('crypto');

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  VERSION: '2.0.0',
  MIN_NODE_VERSION: '14.0.0',
  MIN_NPM_VERSION: '6.0.0',
  TIMEOUT: 300000,
  MAX_PROJECT_NAME_LENGTH: 50,
  BACKUP_DIR: '.web-generator-backup',
  LOG_FILE: 'web-generator.log'
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m'
};

// ============================================================================
// LOGGER CLASS
// ============================================================================

class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.logStream = null;
    this.init();
  }

  init() {
    try {
      this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
      this.info('Logger initialized');
    } catch (error) {
      console.error(`${COLORS.red}Failed to initialize logger: ${error.message}${COLORS.reset}`);
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data || undefined,
      pid: process.pid,
      platform: os.platform()
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    if (this.logStream) {
      this.logStream.write(logLine);
    }

    const colorMap = {
      ERROR: COLORS.red,
      WARN: COLORS.yellow,
      INFO: COLORS.cyan,
      SUCCESS: COLORS.green,
      DEBUG: COLORS.magenta
    };

    const color = colorMap[level] || COLORS.white;
    console.log(`${color}[${level}]${COLORS.reset} ${message}`);
    
    if (data && level === 'ERROR') {
      console.log(`${COLORS.dim}${JSON.stringify(data, null, 2)}${COLORS.reset}`);
    }
  }

  error(message, data) { this.log('ERROR', message, data); }
  warn(message, data) { this.log('WARN', message, data); }
  info(message, data) { this.log('INFO', message, data); }
  success(message, data) { this.log('SUCCESS', message, data); }
  debug(message, data) { this.log('DEBUG', message, data); }

  close() {
    if (this.logStream) {
      this.logStream.end();
    }
  }
}

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

class Validator {
  static validateProjectName(name) {
    const errors = [];

    if (!name || name.trim() === '') {
      errors.push('Project name cannot be empty');
    }

    if (name.length > CONFIG.MAX_PROJECT_NAME_LENGTH) {
      errors.push(`Project name too long (max ${CONFIG.MAX_PROJECT_NAME_LENGTH} characters)`);
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      errors.push('Project name can only contain letters, numbers, hyphens, and underscores');
    }

    if (/^[0-9]/.test(name)) {
      errors.push('Project name cannot start with a number');
    }

    const reserved = ['node_modules', 'test', 'src', 'public', 'views'];
    if (reserved.includes(name.toLowerCase())) {
      errors.push(`"${name}" is a reserved name`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateVersion(version, minVersion) {
    const parse = (v) => v.split('.').map(n => parseInt(n, 10));
    const current = parse(version);
    const minimum = parse(minVersion);

    for (let i = 0; i < 3; i++) {
      if (current[i] > minimum[i]) return true;
      if (current[i] < minimum[i]) return false;
    }
    return true;
  }

  static validatePort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum > 0 && portNum < 65536;
  }

  static sanitizePath(userPath) {
    const normalized = path.normalize(userPath);
    if (normalized.includes('..')) {
      throw new Error('Path traversal detected');
    }
    return normalized;
  }
}

// ============================================================================
// FILE SYSTEM MANAGER
// ============================================================================

class FileSystemManager {
  constructor(logger) {
    this.logger = logger;
    this.createdFiles = [];
    this.createdDirs = [];
  }

  async createDirectory(dirPath, recursive = true) {
    try {
      const sanitized = Validator.sanitizePath(dirPath);
      
      if (!fs.existsSync(sanitized)) {
        fs.mkdirSync(sanitized, { recursive, mode: 0o755 });
        this.createdDirs.push(sanitized);
        this.logger.debug(`Created directory: ${sanitized}`);
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to create directory: ${dirPath}`, error);
      throw new Error(`Directory creation failed: ${error.message}`);
    }
  }

  async writeFile(filePath, content, options = {}) {
    try {
      const sanitized = Validator.sanitizePath(filePath);
      const dir = path.dirname(sanitized);
      
      if (!fs.existsSync(dir)) {
        await this.createDirectory(dir);
      }

      fs.writeFileSync(sanitized, content, { 
        encoding: options.encoding || 'utf8',
        mode: options.mode || 0o644,
        flag: options.flag || 'w'
      });
      
      this.createdFiles.push(sanitized);
      this.logger.debug(`Created file: ${sanitized}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error);
      throw new Error(`File write failed: ${error.message}`);
    }
  }

  async rollback() {
    this.logger.warn('Rolling back file system changes...');
    
    let rollbackErrors = 0;

    for (const file of this.createdFiles.reverse()) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          this.logger.debug(`Deleted file: ${file}`);
        }
      } catch (error) {
        rollbackErrors++;
        this.logger.error(`Failed to delete file during rollback: ${file}`, error);
      }
    }

    for (const dir of this.createdDirs.reverse()) {
      try {
        if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
          fs.rmdirSync(dir);
          this.logger.debug(`Deleted directory: ${dir}`);
        }
      } catch (error) {
        rollbackErrors++;
        this.logger.error(`Failed to delete directory during rollback: ${dir}`, error);
      }
    }

    if (rollbackErrors > 0) {
      this.logger.warn(`Rollback completed with ${rollbackErrors} errors`);
    } else {
      this.logger.success('Rollback completed successfully');
    }
  }

  getCreatedStructure() {
    return {
      files: this.createdFiles,
      directories: this.createdDirs,
      totalFiles: this.createdFiles.length,
      totalDirectories: this.createdDirs.length
    };
  }
}

// ============================================================================
// PACKAGE MANAGER
// ============================================================================

class PackageManager {
  constructor(logger) {
    this.logger = logger;
    this.installedPackages = [];
  }

  async installDependencies(projectDir, dependencies, dev = false) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Installation timeout after ${CONFIG.TIMEOUT / 1000} seconds`));
      }, CONFIG.TIMEOUT);

      const packages = Array.isArray(dependencies) ? dependencies : [dependencies];
      const devFlag = dev ? '--save-dev' : '';

      this.logger.info(`Installing: ${packages.join(', ')}`);

      const args = ['install', devFlag, ...packages].filter(Boolean);
      const child = spawn('npm', args, {
        cwd: projectDir,
        stdio: ['inherit', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        process.stdout.write('.');
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timeout);
        console.log('');

        if (code === 0) {
          this.installedPackages.push(...packages);
          this.logger.success(`Successfully installed: ${packages.join(', ')}`);
          resolve();
        } else {
          this.logger.error(`Installation failed with code ${code}`, { stdout, stderr });
          reject(new Error(`Package installation failed: ${stderr || stdout}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        this.logger.error('Installation process error', error);
        reject(error);
      });
    });
  }
}

// ============================================================================
// SYSTEM REQUIREMENTS CHECKER
// ============================================================================

class SystemChecker {
  constructor(logger) {
    this.logger = logger;
  }

  async checkAll() {
    this.logger.info('Checking system requirements...');
    
    try {
      await this.checkNodeVersion();
      await this.checkNpmVersion();
      this.logger.success('All system checks passed');
      return true;
    } catch (error) {
      this.logger.error('System check failed', error);
      return false;
    }
  }

  async checkNodeVersion() {
    const version = process.version.substring(1);
    
    if (!Validator.validateVersion(version, CONFIG.MIN_NODE_VERSION)) {
      throw new Error(`Node.js version ${version} is below minimum ${CONFIG.MIN_NODE_VERSION}`);
    }

    this.logger.info(`✓ Node.js version: ${version}`);
    return true;
  }

  async checkNpmVersion() {
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    
    if (!Validator.validateVersion(version, CONFIG.MIN_NPM_VERSION)) {
      throw new Error(`npm version ${version} is below minimum ${CONFIG.MIN_NPM_VERSION}`);
    }

    this.logger.info(`✓ npm version: ${version}`);
    return true;
  }
}

// ============================================================================
// INTERACTIVE CLI
// ============================================================================

class InteractiveCLI {
  constructor(logger) {
    this.logger = logger;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  question(query) {
    return new Promise(resolve => {
      this.rl.question(query, resolve);
    });
  }

  showBanner() {
    const banner = `
${COLORS.cyan}${COLORS.bright}
   ▓█████▄ ▓█████ ██▒   █▓
   ▒██▀ ██▌▓█   ▀▓██░   █▒
   ░██   █▌▒███   ▓██  █▒░
   ░▓█▄   ▌▒▓█  ▄  ▒██ █░░
   ░▒████▓ ░▒████▒  ▒▀█░  
    ▒▒▓  ▒ ░░ ▒░ ░  ░ ▐░  
    ░ ▒  ▒  ░ ░  ░  ░ ░░  
    ░ ░  ░    ░       ░░  
      ░       ░  ░     ░  
          🚀 DEV WEB v${CONFIG.VERSION}
${COLORS.reset}
`;
    console.log(banner);
  }

  cleanup() {
    this.rl.close();
  }
}

// ============================================================================
// PROJECT GENERATOR - FIXED VERSION
// ============================================================================

class ProjectGenerator {
  constructor(logger, fsManager, packageManager) {
    this.logger = logger;
    this.fsManager = fsManager;
    this.packageManager = packageManager;
    this.config = {};
  }

  async generate(config) {
    this.config = config;
    const startTime = Date.now();

    try {
      this.logger.info('Starting project generation...');
      
      await this.createStructure();
      await this.generateFiles();
      await this.installDependencies();
      await this.postGeneration();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.success(`Project generated in ${duration}s`);
      
      return true;
    } catch (error) {
      this.logger.error('Project generation failed', error);
      await this.fsManager.rollback();
      throw error;
    }
  }

  async createStructure() {
    const { projectName, useEjs } = this.config;
    const rootDir = path.join(process.cwd(), projectName);

    const dirs = [
      'src/services',
      'src/routes',
      'src/middleware',
      'src/utils',
      'src/config',
      'public/css',
      'public/js',
      'public/images',
      'public/uploads',
      'tests',
      'logs'
    ];

    if (useEjs === 'EJS (Dynamic)') {
      dirs.push('views/components', 'views/pages', 'views/layouts');
    }

    for (const dir of dirs) {
      await this.fsManager.createDirectory(path.join(rootDir, dir));
    }

    this.logger.success(`Created ${dirs.length} directories`);
  }

  async generateFiles() {
    this.logger.info('Generating project files...');
    
    const files = this.getFileTemplates();
    let completed = 0;
    
    for (const [filePath, content] of Object.entries(files)) {
      await this.fsManager.writeFile(filePath, content);
      completed++;
    }
    
    this.logger.success(`Generated ${completed} files`);
  }

  getFileTemplates() {
    const { projectName, useEjs, useDB, port, features } = this.config;
    const rootDir = path.join(process.cwd(), projectName);
    
    const files = {};

    // ✅ MAIN APP FILE
    files[path.join(rootDir, 'src/app.js')] = this.generateAppJs();
    
    // ✅ SERVER FILE
    files[path.join(rootDir, 'src/server.js')] = this.generateServerJs();
    
    // ✅ PACKAGE.JSON
    files[path.join(rootDir, 'package.json')] = this.generatePackageJson();
    
    // ✅ ENV FILES
    files[path.join(rootDir, '.env')] = this.generateEnv();
    files[path.join(rootDir, '.env.example')] = this.generateEnv();
    
    // ✅ GITIGNORE
    files[path.join(rootDir, '.gitignore')] = this.generateGitignore();
    
    // ✅ README
    files[path.join(rootDir, 'README.md')] = this.generateReadme();
    
    // ✅ ROUTES
    files[path.join(rootDir, 'src/routes/index.js')] = this.generateRoutes();
    
    // ✅ DATABASE CONFIG (if needed)
    if (useDB !== 'None') {
      files[path.join(rootDir, 'src/config/database.js')] = this.generateDatabaseConfig();
    }
    
    // ✅ MIDDLEWARE
    if (features.authentication) {
      files[path.join(rootDir, 'src/middleware/auth.js')] = this.generateAuthMiddleware();
    }
    
    // ✅ EJS VIEWS (if needed)
    if (useEjs === 'EJS (Dynamic)') {
      files[path.join(rootDir, 'views/pages/index.ejs')] = this.generateIndexView();
      files[path.join(rootDir, 'views/pages/404.ejs')] = this.generate404View();
      files[path.join(rootDir, 'views/layouts/header.ejs')] = this.generateHeaderView();
      files[path.join(rootDir, 'views/layouts/footer.ejs')] = this.generateFooterView();
    } else {
      files[path.join(rootDir, 'public/index.html')] = this.generateIndexHtml();
    }
    
    // ✅ PUBLIC FILES
    files[path.join(rootDir, 'public/css/style.css')] = this.generateCSS();
    files[path.join(rootDir, 'public/js/main.js')] = this.generateJS();
    
    return files;
  }

  generateAppJs() {
    const { useEjs, useDB, features, port } = this.config;
    
    return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const routes = require('./routes');
${useDB !== 'None' ? "const db = require('./config/database');" : ''}
${features.authentication ? "const authMiddleware = require('./middleware/auth');" : ''}

dotenv.config();

const app = express();
const PORT = process.env.PORT || ${port};

// Security middleware
app.use(helmet());
app.use(cors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

${useEjs === 'EJS (Dynamic)' ? `// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));` : ''}

// Static files
app.use(express.static(path.join(__dirname, '../public')));

${useDB !== 'None' ? `// Database connection
db.connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err.message));` : ''}

// Routes
${useEjs === 'EJS (Dynamic)' ? `app.get('/', (req, res) => {
  res.render('pages/index', { 
    title: '${this.config.projectName}',
    message: 'Welcome to your new project!'
  });
});` : ''}

app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).${useEjs === 'EJS (Dynamic)' ? "render('pages/404')" : "json({ error: 'Not Found' })"};
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    }
  });
});

module.exports = app;
`;
  }

  generateServerJs() {
    return `const app = require('./app');
const PORT = process.env.PORT || ${this.config.port};

const server = app.listen(PORT, () => {
  console.log(\`
╔════════════════════════════════════════════╗
║  🚀 Server running on port \${PORT}
║  📝 Environment: \${process.env.NODE_ENV || 'development'}
║  🌐 URL: http://localhost:\${PORT}
╚════════════════════════════════════════════╝
  \`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
`;
  }

  generatePackageJson() {
    const { projectName, useEjs, useDB, features } = this.config;
    
    const deps = {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "helmet": "^7.1.0",
      "morgan": "^1.10.0"
    };

    if (useEjs === 'EJS (Dynamic)') deps["ejs"] = "^3.1.9";
    if (useDB === 'MySQL') deps["mysql2"] = "^3.6.5";
    if (useDB === 'PostgreSQL') deps["pg"] = "^8.11.3";
    if (useDB === 'MongoDB') deps["mongodb"] = "^6.3.0";
    if (features.authentication) deps["jsonwebtoken"] = "^9.0.2";

    const devDeps = {
      "nodemon": "^3.0.2"
    };

    if (features.linter) {
      devDeps["eslint"] = "^8.55.0";
      devDeps["prettier"] = "^3.1.1";
    }

    return JSON.stringify({
      "name": projectName.toLowerCase().replace(/\s+/g, '-'),
      "version": "1.0.0",
      "description": `A Node.js web application - ${projectName}`,
      "main": "src/server.js",
      "scripts": {
        "start": "node src/server.js",
        "dev": "nodemon src/server.js",
        "test": "echo \\'No tests specified\\'",
        "lint": features.linter ? "eslint src/**/*.js" : "echo \\'No linter configured\\'"
      },
      "keywords": ["nodejs", "express", "web"],
      "author": "",
      "license": "MIT",
      "dependencies": deps,
      "devDependencies": devDeps
    }, null, 2);
  }

  generateEnv() {
    const { projectName, port, useDB, features } = this.config;
    
    let env = `# Application Configuration
NODE_ENV=development
PORT=${port}
APP_NAME=${projectName}

# Security
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
ALLOWED_ORIGINS=http://localhost:${port}

`;

    if (useDB === 'MySQL') {
      env += `# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=${projectName.toLowerCase().replace(/\s+/g, '_')}
`;
    }

    if (useDB === 'PostgreSQL') {
      env += `# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=${projectName.toLowerCase().replace(/\s+/g, '_')}
`;
    }

    if (useDB === 'MongoDB') {
      env += `# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=${projectName.toLowerCase().replace(/\s+/g, '_')}
`;
    }

    return env;
  }

  generateGitignore() {
    return `node_modules/
.env
.DS_Store
*.log
logs/
dist/
build/
coverage/
.vscode/
.idea/
public/uploads/*
!public/uploads/.gitkeep
`;
  }

  generateReadme() {
    const { projectName, port } = this.config;
    
    return `# ${projectName}

A modern Node.js web application built with Express.

## 🚀 Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
\`\`\`

## 📝 Configuration

Copy \`.env.example\` to \`.env\` and configure your environment variables.

## 🌐 URLs

- Development: http://localhost:${port}
- Health Check: http://localhost:${port}/health

## 📦 Scripts

- \`npm start\` - Start production server
- \`npm run dev\` - Start development server with nodemon
- \`npm test\` - Run tests

## 🛠️ Tech Stack

- Node.js
- Express
- ${this.config.useEjs === 'EJS (Dynamic)' ? 'EJS' : 'Plain HTML'}
${this.config.useDB !== 'None' ? `- ${this.config.useDB}` : ''}

## 📄 License

MIT
`;
  }

  generateRoutes() {
    return `const express = require('express');
const router = express.Router();

// Example API endpoint
router.get('/status', (req, res) => {
  res.json({ 
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Example data endpoint
router.get('/data', (req, res) => {
  res.json({ 
    data: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' }
    ]
  });
});

module.exports = router;
`;
  }

  generateDatabaseConfig() {
    const { useDB } = this.config;
    
    if (useDB === 'MySQL') {
      return `const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const connect = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    throw error;
  }
};

const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = { pool, connect, query };
`;
    } else if (useDB === 'PostgreSQL') {
      return `const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  max: 10
});

const connect = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL Database connected');
    client.release();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    throw error;
  }
};

const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = { pool, connect, query };
`;
    } else if (useDB === 'MongoDB') {
      return `const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME;

let client;
let db;

const connect = async () => {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ MongoDB connected');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

module.exports = { connect, getDb };
`;
    }
    return '';
  }

  generateAuthMiddleware() {
    return `const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = { generateToken, verifyToken, authenticate };
`;
  }

  generateIndexView() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <%- include('../layouts/header') %>
  <title><%= title %></title>
</head>
<body>
  <div class="container">
    <header class="hero">
      <h1>🚀 <%= title %></h1>
      <p class="subtitle"><%= message %></p>
    </header>
    
    <main class="content">
      <section class="card">
        <h2>Welcome!</h2>
        <p>Your project is now running successfully.</p>
        <div class="buttons">
          <a href="/api/status" class="btn btn-primary">Check API Status</a>
          <a href="/health" class="btn btn-secondary">Health Check</a>
        </div>
      </section>

      <section class="features">
        <div class="feature-card">
          <h3>⚡ Fast</h3>
          <p>Built with Express.js for high performance</p>
        </div>
        <div class="feature-card">
          <h3>🔒 Secure</h3>
          <p>Includes security best practices</p>
        </div>
        <div class="feature-card">
          <h3>📦 Modular</h3>
          <p>Clean, organized code structure</p>
        </div>
      </section>
    </main>

    <%- include('../layouts/footer') %>
  </div>
  <script src="/js/main.js"></script>
</body>
</html>
`;
  }

  generate404View() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <%- include('../layouts/header') %>
  <title>404 - Page Not Found</title>
</head>
<body>
  <div class="container">
    <div class="error-page">
      <h1>404</h1>
      <p>Page Not Found</p>
      <a href="/" class="btn btn-primary">Go Home</a>
    </div>
  </div>
</body>
</html>
`;
  }

  generateHeaderView() {
    return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="ie=edge">
<link rel="stylesheet" href="/css/style.css">
`;
  }

  generateFooterView() {
    return `<footer class="footer">
  <p>&copy; <%= new Date().getFullYear() %> ${this.config.projectName}. All rights reserved.</p>
  <p>Built with ❤️ using Node.js & Express</p>
</footer>
`;
  }

  generateIndexHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.config.projectName}</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="container">
    <header class="hero">
      <h1>🚀 ${this.config.projectName}</h1>
      <p class="subtitle">Welcome to your new project!</p>
    </header>
    
    <main class="content">
      <section class="card">
        <h2>Getting Started</h2>
        <p>Your project is now running successfully.</p>
        <div class="buttons">
          <a href="/api/status" class="btn btn-primary">Check API Status</a>
          <a href="/health" class="btn btn-secondary">Health Check</a>
        </div>
      </section>

      <section class="features">
        <div class="feature-card">
          <h3>⚡ Fast</h3>
          <p>Built with Express.js for high performance</p>
        </div>
        <div class="feature-card">
          <h3>🔒 Secure</h3>
          <p>Includes security best practices</p>
        </div>
        <div class="feature-card">
          <h3>📦 Modular</h3>
          <p>Clean, organized code structure</p>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>&copy; ${new Date().getFullYear()} ${this.config.projectName}. All rights reserved.</p>
      <p>Built with ❤️ using Node.js & Express</p>
    </footer>
  </div>
  <script src="/js/main.js"></script>
</body>
</html>
`;
  }

  generateCSS() {
    return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #3498db;
  --secondary: #2ecc71;
  --dark: #2c3e50;
  --light: #ecf0f1;
  --danger: #e74c3c;
  --shadow: 0 2px 10px rgba(0,0,0,0.1);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: var(--dark);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  border-radius: 10px;
  margin-bottom: 40px;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.subtitle {
  font-size: 1.3rem;
  opacity: 0.9;
}

.content {
  padding: 20px 0;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: var(--shadow);
  margin-bottom: 30px;
  border-left: 4px solid var(--primary);
}

.card h2 {
  color: var(--primary);
  margin-bottom: 15px;
}

.buttons {
  display: flex;
  gap: 15px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 12px 30px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.btn-secondary {
  background: var(--secondary);
  color: white;
}

.btn-secondary:hover {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.feature-card {
  background: var(--light);
  padding: 25px;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow);
}

.feature-card h3 {
  color: var(--primary);
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.footer {
  text-align: center;
  padding: 30px 0;
  margin-top: 40px;
  border-top: 2px solid var(--light);
  color: #7f8c8d;
}

.error-page {
  text-align: center;
  padding: 100px 20px;
}

.error-page h1 {
  font-size: 6rem;
  color: var(--danger);
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
`;
  }

  generateJS() {
    return `// Main JavaScript file
console.log('🚀 Application loaded successfully!');

// Example: Fetch API status
async function checkAPIStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    console.log('API Status:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
}

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Check API on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');
  checkAPIStatus();
});
`;
  }

  async installDependencies() {
    const { projectName } = this.config;
    const projectDir = path.join(process.cwd(), projectName);

    this.logger.info('Installing dependencies...');
    await this.packageManager.installDependencies(projectDir, ['express', 'cors', 'dotenv', 'helmet', 'morgan'], { flags: '--no-bin-links' });
    
    if (this.config.useEjs === 'EJS (Dynamic)') {
      await this.packageManager.installDependencies(projectDir, 'ejs');
    }
    
    if (this.config.useDB === 'MySQL') {
      await this.packageManager.installDependencies(projectDir, 'mysql2');
    } else if (this.config.useDB === 'PostgreSQL') {
      await this.packageManager.installDependencies(projectDir, 'pg');
    } else if (this.config.useDB === 'MongoDB') {
      await this.packageManager.installDependencies(projectDir, 'mongodb');
    }
    
    if (this.config.features.authentication) {
      await this.packageManager.installDependencies(projectDir, 'jsonwebtoken');
    }
    
    this.logger.info('Installing dev dependencies...');
    await this.packageManager.installDependencies(projectDir, 'nodemon', true, '--no-bin-links');
    
    if (this.config.features.linter) {
      await this.packageManager.installDependencies(projectDir, 'eslint prettier', true);
    }
  }

  async postGeneration() {
    this.logger.info('Running post-generation tasks...');
    
    if (this.config.initGit) {
      try {
        const projectDir = path.join(process.cwd(), this.config.projectName);
        execSync('git init', { cwd: projectDir, stdio: 'pipe' });
        this.logger.success('Initialized git repository');
      } catch (error) {
        this.logger.warn('Could not initialize git repository', error);
      }
    }
  }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

class Application {
  constructor() {
    this.logger = new Logger(CONFIG.LOG_FILE);
    this.cli = new InteractiveCLI(this.logger);
    this.fsManager = new FileSystemManager(this.logger);
    this.packageManager = new PackageManager(this.logger);
    this.systemChecker = new SystemChecker(this.logger);
    this.generator = new ProjectGenerator(this.logger, this.fsManager, this.packageManager);
  }

  async run() {
    try {
      console.clear();
      this.cli.showBanner();
      
      const systemOk = await this.systemChecker.checkAll();
      if (!systemOk) {
        throw new Error('System requirements not met');
      }

      console.log('');
      const config = await this.getProjectConfiguration();

      const confirmed = await this.confirmConfiguration(config);
      if (!confirmed) {
        this.logger.info('Project generation cancelled by user');
        process.exit(0);
      }

      await this.generator.generate(config);

      this.showSuccessMessage(config);

    } catch (error) {
      this.logger.error('Application error', error);
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }

  async getProjectConfiguration() {
    const config = {};

    while (true) {
      const name = await this.cli.question(`${COLORS.cyan}📝 Project name: ${COLORS.reset}`);
      const validation = Validator.validateProjectName(name);
      
      if (validation.valid) {
        const projectPath = path.join(process.cwd(), name);
        if (fs.existsSync(projectPath)) {
          this.logger.error(`Directory "${name}" already exists`);
          const overwrite = await this.cli.question(`${COLORS.yellow}Overwrite? (yes/no): ${COLORS.reset}`);
          if (overwrite.toLowerCase() === 'yes') {
            try {
              fs.rmSync(projectPath, { recursive: true, force: true });
              this.logger.success('Existing directory removed');
            } catch (error) {
              this.logger.error('Failed to remove existing directory', error);
              continue;
            }
          } else {
            continue;
          }
        }
        config.projectName = name;
        break;
      } else {
        validation.errors.forEach(err => this.logger.error(err));
      }
    }

    const ejsAnswer = await this.cli.question(`${COLORS.cyan}🎨 Use EJS template engine? (Y/n): ${COLORS.reset}`);
    config.useEjs = ejsAnswer.toLowerCase() !== 'n' ? 'EJS (Dynamic)' : 'Plain HTML (Static)';

    const dbAnswer = await this.cli.question(`${COLORS.cyan}🗄️  Use database? (mysql/postgresql/mongodb/none): ${COLORS.reset}`);
    const dbMap = {
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mongo': 'MongoDB',
      'mongodb': 'MongoDB',
      'none': 'None',
      '': 'None'
    };
    config.useDB = dbMap[dbAnswer.toLowerCase()] || 'None';

    config.features = {};
    
    const authAnswer = await this.cli.question(`${COLORS.cyan}🔐 Add authentication (JWT)? (Y/n): ${COLORS.reset}`);
    config.features.authentication = authAnswer.toLowerCase() !== 'n';

    const linterAnswer = await this.cli.question(`${COLORS.cyan}📋 Add ESLint + Prettier? (Y/n): ${COLORS.reset}`);
    config.features.linter = linterAnswer.toLowerCase() !== 'n';

    while (true) {
      const port = await this.cli.question(`${COLORS.cyan}🔌 Server port (default: 3000): ${COLORS.reset}`) || '3000';
      if (Validator.validatePort(port)) {
        config.port = port;
        break;
      } else {
        this.logger.error('Invalid port number');
      }
    }

    const gitAnswer = await this.cli.question(`${COLORS.cyan}📦 Initialize git repository? (Y/n): ${COLORS.reset}`);
    config.initGit = gitAnswer.toLowerCase() !== 'n';

    return config;
  }

  async confirmConfiguration(config) {
    console.log(`\n${COLORS.bright}${COLORS.bgBlue} PROJECT CONFIGURATION ${COLORS.reset}\n`);
    console.log(`${COLORS.cyan}  Project Name:${COLORS.reset}     ${config.projectName}`);
    console.log(`${COLORS.cyan}  Template:${COLORS.reset}         ${config.useEjs}`);
    console.log(`${COLORS.cyan}  Database:${COLORS.reset}         ${config.useDB}`);
    console.log(`${COLORS.cyan}  Port:${COLORS.reset}             ${config.port}`);
    console.log(`${COLORS.cyan}  Authentication:${COLORS.reset}   ${config.features.authentication ? 'Yes' : 'No'}`);
    console.log(`${COLORS.cyan}  Linter:${COLORS.reset}           ${config.features.linter ? 'Yes' : 'No'}`);
    console.log(`${COLORS.cyan}  Git Init:${COLORS.reset}         ${config.initGit ? 'Yes' : 'No'}`);
    
    const confirm = await this.cli.question(`\n${COLORS.yellow}Proceed with generation? (Y/n): ${COLORS.reset}`);
    return confirm.toLowerCase() !== 'n';
  }

  showSuccessMessage(config) {
    console.log(`\n${COLORS.green}${COLORS.bright}╔${'═'.repeat(60)}╗${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}║${' '.repeat(23)}🎉 SUCCESS! 🎉${' '.repeat(23)}║${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}╚${'═'.repeat(60)}╝${COLORS.reset}\n`);

    const projectPath = path.join(process.cwd(), config.projectName);
    console.log(`${COLORS.cyan}📁 Project created at:${COLORS.reset} ${COLORS.bright}${projectPath}${COLORS.reset}\n`);

    const structure = this.fsManager.getCreatedStructure();
    console.log(`${COLORS.dim}  Created: ${structure.totalFiles} files, ${structure.totalDirectories} directories${COLORS.reset}\n`);

    console.log(`${COLORS.yellow}${COLORS.bright}📋 Next Steps:${COLORS.reset}\n`);
    console.log(`  ${COLORS.cyan}1.${COLORS.reset} cd ${config.projectName}`);
    console.log(`  ${COLORS.cyan}2.${COLORS.reset} npm run dev ${COLORS.dim}(start development server)${COLORS.reset}`);
    
    if (config.useDB !== 'None') {
      console.log(`  ${COLORS.cyan}3.${COLORS.reset} Configure database in .env file`);
      console.log(`  ${COLORS.cyan}4.${COLORS.reset} Create database: ${COLORS.dim}CREATE DATABASE ${config.projectName.toLowerCase().replace(/\s+/g, '_')};${COLORS.reset}`);
    }

    console.log(`\n${COLORS.green}${COLORS.bright}🚀 Your application will run on:${COLORS.reset}`);
    console.log(`   ${COLORS.underscore}http://localhost:${config.port}${COLORS.reset}\n`);

    console.log(`${COLORS.bright}Happy coding! 💻✨${COLORS.reset}\n`);
  }

  cleanup() {
    this.cli.cleanup();
    this.logger.close();
  }
}

// ============================================================================
// ERROR HANDLERS
// ============================================================================

process.on('uncaughtException', (error) => {
  console.error(`${COLORS.red}${COLORS.bright}UNCAUGHT EXCEPTION:${COLORS.reset}`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${COLORS.red}${COLORS.bright}UNHANDLED REJECTION:${COLORS.reset}`, reason);
  process.exit(1);
});

// ============================================================================
// ENTRY POINT
// ============================================================================

if (require.main === module) {
  const app = new Application();
  app.run().catch((error) => {
    console.error(`${COLORS.red}${COLORS.bright}Fatal error:${COLORS.reset}`, error);
    process.exit(1);
  });
}

module.exports = { Application, Validator, Logger };