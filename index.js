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
  TIMEOUT: 300000, // 5 minutes
  MAX_PROJECT_NAME_LENGTH: 50,
  BACKUP_DIR: '.web-generator-backup',
  LOG_FILE: 'web-generator.log'
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
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

    // Console output with colors
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
    // Prevent directory traversal
    const normalized = path.normalize(userPath);
    if (normalized.includes('..')) {
      throw new Error('Path traversal detected');
    }
    return normalized;
  }

  static validateDatabaseConfig(config) {
    const errors = [];

    if (config.type === 'mysql') {
      if (!config.host || config.host.trim() === '') {
        errors.push('Database host is required');
      }
      if (!config.database || config.database.trim() === '') {
        errors.push('Database name is required');
      }
      if (!config.user || config.user.trim() === '') {
        errors.push('Database user is required');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
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

  async copyFile(source, destination) {
    try {
      const sanitizedSrc = Validator.sanitizePath(source);
      const sanitizedDest = Validator.sanitizePath(destination);
      
      fs.copyFileSync(sanitizedSrc, sanitizedDest);
      this.createdFiles.push(sanitizedDest);
      this.logger.debug(`Copied file: ${sanitizedSrc} -> ${sanitizedDest}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to copy file: ${source} -> ${destination}`, error);
      throw new Error(`File copy failed: ${error.message}`);
    }
  }

  async checkWritePermission(dirPath) {
    try {
      const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch (error) {
      this.logger.error(`No write permission in: ${dirPath}`, error);
      return false;
    }
  }

  async getDiskSpace(dirPath) {
    try {
      // Platform-specific disk space check
      if (os.platform() === 'win32') {
        const drive = path.parse(dirPath).root;
        const output = execSync(`wmic logicaldisk where "DeviceID='${drive.replace('\\', '')}'" get FreeSpace,Size`, {
          encoding: 'utf8'
        });
        const lines = output.trim().split('\n');
        const values = lines[1].trim().split(/\s+/);
        return {
          free: parseInt(values[0], 10),
          total: parseInt(values[1], 10)
        };
      } else {
        const output = execSync(`df -k "${dirPath}"`, { encoding: 'utf8' });
        const lines = output.trim().split('\n');
        const values = lines[1].trim().split(/\s+/);
        return {
          free: parseInt(values[3], 10) * 1024,
          total: parseInt(values[1], 10) * 1024
        };
      }
    } catch (error) {
      this.logger.warn('Failed to get disk space', error);
      return { free: Infinity, total: Infinity };
    }
  }

  async rollback() {
    this.logger.warn('Rolling back file system changes...');
    
    let rollbackErrors = 0;

    // Delete created files
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

    // Delete created directories
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

  async detectPackageManager() {
    const managers = ['npm', 'yarn', 'pnpm'];
    
    for (const manager of managers) {
      try {
        execSync(`${manager} --version`, { stdio: 'pipe' });
        this.logger.info(`Detected package manager: ${manager}`);
        return manager;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('No package manager found. Please install npm, yarn, or pnpm');
  }

  async installDependencies(projectDir, dependencies, dev = false) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Installation timeout after ${CONFIG.TIMEOUT / 1000} seconds`));
      }, CONFIG.TIMEOUT);

      const packages = Array.isArray(dependencies) ? dependencies.join(' ') : dependencies;
      const devFlag = dev ? '--save-dev' : '';
      const command = `npm install ${devFlag} ${packages}`;

      this.logger.info(`Installing: ${packages}`);

      const child = spawn('npm', ['install', devFlag, ...packages.split(' ')].filter(Boolean), {
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
        console.log(''); // New line after dots

        if (code === 0) {
          this.installedPackages.push(...packages.split(' '));
          this.logger.success(`Successfully installed: ${packages}`);
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

  async verifyInstallation(projectDir, packages) {
    const missing = [];
    const packageJsonPath = path.join(projectDir, 'package.json');

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const pkg of packages) {
        const pkgName = pkg.split('@')[0];
        if (!allDeps[pkgName]) {
          missing.push(pkgName);
        }
      }

      if (missing.length > 0) {
        this.logger.warn('Missing packages detected', { missing });
        return false;
      }

      this.logger.success('All packages verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Failed to verify installation', error);
      return false;
    }
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
    
    const checks = [
      this.checkNodeVersion(),
      this.checkNpmVersion(),
      this.checkDiskSpace(),
      this.checkMemory(),
      this.checkNetwork()
    ];

    const results = await Promise.allSettled(checks);
    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      failures.forEach(f => this.logger.error('System check failed', f.reason));
      return false;
    }

    this.logger.success('All system checks passed');
    return true;
  }

  async checkNodeVersion() {
    try {
      const version = process.version.substring(1);
      
      if (!Validator.validateVersion(version, CONFIG.MIN_NODE_VERSION)) {
        throw new Error(`Node.js version ${version} is below minimum ${CONFIG.MIN_NODE_VERSION}`);
      }

      this.logger.info(`✓ Node.js version: ${version}`);
      return true;
    } catch (error) {
      throw new Error(`Node.js check failed: ${error.message}`);
    }
  }

  async checkNpmVersion() {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      
      if (!Validator.validateVersion(version, CONFIG.MIN_NPM_VERSION)) {
        throw new Error(`npm version ${version} is below minimum ${CONFIG.MIN_NPM_VERSION}`);
      }

      this.logger.info(`✓ npm version: ${version}`);
      return true;
    } catch (error) {
      throw new Error(`npm check failed: ${error.message}`);
    }
  }

  async checkDiskSpace() {
    try {
      const fsManager = new FileSystemManager(this.logger);
      const space = await fsManager.getDiskSpace(process.cwd());
      const requiredSpace = 100 * 1024 * 1024; // 100 MB

      if (space.free < requiredSpace) {
        throw new Error(`Insufficient disk space. Required: 100MB, Available: ${Math.round(space.free / 1024 / 1024)}MB`);
      }

      this.logger.info(`✓ Disk space: ${Math.round(space.free / 1024 / 1024)}MB available`);
      return true;
    } catch (error) {
      this.logger.warn('Could not verify disk space', error);
      return true; // Non-critical
    }
  }

  async checkMemory() {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const requiredMem = 512 * 1024 * 1024; // 512 MB

      if (freeMem < requiredMem) {
        this.logger.warn(`Low memory: ${Math.round(freeMem / 1024 / 1024)}MB available`);
      }

      this.logger.info(`✓ Memory: ${Math.round(freeMem / 1024 / 1024)}MB / ${Math.round(totalMem / 1024 / 1024)}MB`);
      return true;
    } catch (error) {
      this.logger.warn('Could not check memory', error);
      return true; // Non-critical
    }
  }

  async checkNetwork() {
    try {
      const dns = require('dns').promises;
      await dns.resolve('registry.npmjs.org');
      this.logger.info('✓ Network connectivity: OK');
      return true;
    } catch (error) {
      this.logger.warn('Network connectivity check failed - may affect package installation', error);
      return true; // Non-critical, will fail later if needed
    }
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      nodeVersion: process.version,
      homeDir: os.homedir(),
      tmpDir: os.tmpdir()
    };
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

  async select(question, options, config = {}) {
    return new Promise((resolve) => {
      let selected = config.default || 0;
      const showHelp = config.help || false;
      
      const render = () => {
        console.clear();
        this.showBanner();
        console.log(`${COLORS.bright}${question}${COLORS.reset}\n`);
        
        options.forEach((option, index) => {
          const prefix = index === selected ? 
            `${COLORS.green}${COLORS.bright}➤ ` : '  ';
          const suffix = COLORS.reset;
          console.log(`${prefix}${option}${suffix}`);
        });
        
        if (showHelp) {
          console.log(`\n${COLORS.dim}${config.helpText || 'Use arrow keys to navigate'}${COLORS.reset}`);
        }
        
        console.log(`\n${COLORS.yellow}↑↓ Navigate | Enter Select | Ctrl+C Exit${COLORS.reset}`);
      };
      
      render();
      
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      const onData = (key) => {
        if (key === '\u001B\u005B\u0041') { // Up
          selected = selected > 0 ? selected - 1 : options.length - 1;
          render();
        } else if (key === '\u001B\u005B\u0042') { // Down
          selected = selected < options.length - 1 ? selected + 1 : 0;
          render();
        } else if (key === '\r' || key === '\n') { // Enter
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          console.log('');
          resolve(options[selected]);
        } else if (key === '\u0003') { // Ctrl+C
          this.cleanup();
          process.exit(0);
        }
      };
      
      stdin.on('data', onData);
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

  showProgress(message, duration = 2000) {
    return new Promise((resolve) => {
      const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      
      const interval = setInterval(() => {
        process.stdout.write(`\r${COLORS.cyan}${frames[i]} ${message}${COLORS.reset}`);
        i = (i + 1) % frames.length;
      }, 80);
      
      setTimeout(() => {
        clearInterval(interval);
        process.stdout.write(`\r${COLORS.green}✓ ${message}${COLORS.reset}\n`);
        resolve();
      }, duration);
    });
  }

  showProgressBar(label, current, total) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 40);
    const bar = '█'.repeat(filled) + '░'.repeat(40 - filled);
    
    process.stdout.write(`\r${COLORS.cyan}${label}: [${bar}] ${percentage}%${COLORS.reset}`);
    
    if (current >= total) {
      console.log('');
    }
  }

  cleanup() {
    this.rl.close();
  }
}

// ============================================================================
// PROJECT GENERATOR
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
      
      // Create project structure
      await this.createStructure();
      
      // Generate files
      await this.generateFiles();
      
      // Install dependencies
      await this.installDependencies();
      
      // Post-generation tasks
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
      'tests'
    ];

    if (useEjs) {
      dirs.push('views/components', 'views/pages', 'views/layouts');
    } else {
      dirs.push('src/components', 'src/pages');
    }

    let completed = 0;
    for (const dir of dirs) {
      await this.fsManager.createDirectory(path.join(rootDir, dir));
      completed++;
      // Progress indication could be added here
    }

    this.logger.success(`Created ${dirs.length} directories`);
  }

  async generateFiles() {
    // Implementation would include all template generation
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
    // Return all file templates based on configuration
    // This would be similar to your existing templates but more organized
    return {};
  }

  async installDependencies() {
    const { projectName, useEjs, useDB } = this.config;
    const projectDir = path.join(process.cwd(), projectName);

    const dependencies = ['express', 'cors', 'dotenv', 'helmet', 'morgan'];
    
    if (useEjs) dependencies.push('ejs');
    if (useDB === 'mysql') dependencies.push('mysql2');

    await this.packageManager.installDependencies(projectDir, dependencies);
    
    const devDependencies = ['nodemon', 'eslint', 'prettier'];
    await this.packageManager.installDependencies(projectDir, devDependencies, true);
  }

  async postGeneration() {
    this.logger.info('Running post-generation tasks...');
    
    // Initialize git repository
    try {
      const projectDir = path.join(process.cwd(), this.config.projectName);
      execSync('git init', { cwd: projectDir, stdio: 'pipe' });
      this.logger.success('Initialized git repository');
    } catch (error) {
      this.logger.warn('Could not initialize git repository', error);
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
      // Show banner
      console.clear();
      this.cli.showBanner();
      
      // Check system requirements
      const systemOk = await this.systemChecker.checkAll();
      if (!systemOk) {
        throw new Error('System requirements not met');
      }

      await this.cli.showProgress('System checks passed', 1000);

      // Get project configuration
      const config = await this.getProjectConfiguration();

      // Confirm configuration
      const confirmed = await this.confirmConfiguration(config);
      if (!confirmed) {
        this.logger.info('Project generation cancelled by user');
        process.exit(0);
      }

      // Generate project
      await this.generator.generate(config);

      // Show success message
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

    // Project name
    while (true) {
      console.log('');
      const name = await this.cli.question(`${COLORS.cyan}📝 Project name: ${COLORS.reset}`);
      const validation = Validator.validateProjectName(name);
      
      if (validation.valid) {
        // Check if directory exists
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

    // Template engine
    config.useEjs = await this.cli.select(
      '🎨 Choose template engine:',
      ['EJS (Dynamic)', 'Plain HTML (Static)', 'None (API Only)'],
      { help: true, helpText: 'EJS allows dynamic content rendering' }
    );

    // Database selection
    config.useDB = await this.cli.select(
      '🗄️  Choose database:',
      ['MySQL', 'PostgreSQL', 'MongoDB', 'None'],
      { help: true, helpText: 'Select database system for your project' }
    );

    // Additional features
    config.features = await this.selectFeatures();

    // Port configuration
    while (true) {
      const port = await this.cli.question(`${COLORS.cyan}🔌 Server port (default: 3000): ${COLORS.reset}`) || '3000';
      if (Validator.validatePort(port)) {
        config.port = port;
        break;
      } else {
        this.logger.error('Invalid port number');
      }
    }

    // Security options
    config.security = await this.cli.select(
      '🔒 Security level:',
      ['Basic (helmet, cors)', 'Standard (+ rate limiting)', 'Advanced (+ CSRF, session)'],
      { default: 1 }
    );

    // Git initialization
    const gitAnswer = await this.cli.question(`${COLORS.cyan}📦 Initialize git repository? (Y/n): ${COLORS.reset}`);
    config.initGit = gitAnswer.toLowerCase() !== 'n';

    return config;
  }

  async selectFeatures() {
    console.log(`\n${COLORS.bright}Select additional features:${COLORS.reset}`);
    const features = {
      authentication: false,
      fileUpload: false,
      swagger: false,
      testing: false,
      docker: false,
      linter: false
    };

    const authAnswer = await this.cli.question(`${COLORS.cyan}  ✓ Authentication (JWT)? (Y/n): ${COLORS.reset}`);
    features.authentication = authAnswer.toLowerCase() !== 'n';

    const uploadAnswer = await this.cli.question(`${COLORS.cyan}  ✓ File upload support? (Y/n): ${COLORS.reset}`);
    features.fileUpload = uploadAnswer.toLowerCase() !== 'n';

    const swaggerAnswer = await this.cli.question(`${COLORS.cyan}  ✓ API documentation (Swagger)? (y/N): ${COLORS.reset}`);
    features.swagger = swaggerAnswer.toLowerCase() === 'y';

    const testAnswer = await this.cli.question(`${COLORS.cyan}  ✓ Testing setup (Jest)? (y/N): ${COLORS.reset}`);
    features.testing = testAnswer.toLowerCase() === 'y';

    const dockerAnswer = await this.cli.question(`${COLORS.cyan}  ✓ Docker support? (y/N): ${COLORS.reset}`);
    features.docker = dockerAnswer.toLowerCase() === 'y';

    const linterAnswer = await this.cli.question(`${COLORS.cyan}  ✓ ESLint + Prettier? (Y/n): ${COLORS.reset}`);
    features.linter = linterAnswer.toLowerCase() !== 'n';

    return features;
  }

  async confirmConfiguration(config) {
    console.log(`\n${COLORS.bright}${COLORS.bgBlue} PROJECT CONFIGURATION ${COLORS.reset}\n`);
    console.log(`${COLORS.cyan}  Project Name:${COLORS.reset}     ${config.projectName}`);
    console.log(`${COLORS.cyan}  Template:${COLORS.reset}         ${config.useEjs}`);
    console.log(`${COLORS.cyan}  Database:${COLORS.reset}         ${config.useDB}`);
    console.log(`${COLORS.cyan}  Port:${COLORS.reset}             ${config.port}`);
    console.log(`${COLORS.cyan}  Security:${COLORS.reset}         ${config.security}`);
    console.log(`${COLORS.cyan}  Git Init:${COLORS.reset}         ${config.initGit ? 'Yes' : 'No'}`);
    console.log(`\n${COLORS.cyan}  Features:${COLORS.reset}`);
    Object.entries(config.features).forEach(([key, value]) => {
      console.log(`    ${value ? '✓' : '✗'} ${key}`);
    });
    
    const estimate = this.estimateGenerationTime(config);
    console.log(`\n${COLORS.dim}  Estimated time: ~${estimate}s${COLORS.reset}`);
    console.log(`${COLORS.dim}  Disk space needed: ~50MB${COLORS.reset}\n`);

    const confirm = await this.cli.question(`${COLORS.yellow}Proceed with generation? (Y/n): ${COLORS.reset}`);
    return confirm.toLowerCase() !== 'n';
  }

  estimateGenerationTime(config) {
    let time = 10; // Base time
    if (config.useDB !== 'None') time += 5;
    if (config.features.authentication) time += 3;
    if (config.features.swagger) time += 2;
    if (config.features.testing) time += 4;
    if (config.features.docker) time += 2;
    return time;
  }

  showSuccessMessage(config) {
    console.log(`\n${COLORS.green}${COLORS.bright}╔${'═'.repeat(65)}╗${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}║${' '.repeat(65)}║${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}║${' '.repeat(20)}🎉 SUCCESS! 🎉${' '.repeat(23)}║${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}║${' '.repeat(65)}║${COLORS.reset}`);
    console.log(`${COLORS.green}${COLORS.bright}╚${'═'.repeat(65)}╝${COLORS.reset}\n`);

    const projectPath = path.join(process.cwd(), config.projectName);
    console.log(`${COLORS.cyan}📁 Project created at:${COLORS.reset} ${COLORS.bright}${projectPath}${COLORS.reset}\n`);

    const structure = this.fsManager.getCreatedStructure();
    console.log(`${COLORS.dim}  Created: ${structure.totalFiles} files, ${structure.totalDirectories} directories${COLORS.reset}\n`);

    console.log(`${COLORS.yellow}${COLORS.bright}📋 Next Steps:${COLORS.reset}\n`);
    console.log(`  ${COLORS.cyan}1.${COLORS.reset} cd ${config.projectName}`);
    console.log(`  ${COLORS.cyan}2.${COLORS.reset} npm run dev ${COLORS.dim}(start development server)${COLORS.reset}`);
    
    if (config.useDB !== 'None') {
      console.log(`  ${COLORS.cyan}3.${COLORS.reset} Configure database in .env file`);
      console.log(`  ${COLORS.cyan}4.${COLORS.reset} Create database: ${COLORS.dim}CREATE DATABASE ${config.projectName};${COLORS.reset}`);
    }

    console.log(`\n${COLORS.magenta}${COLORS.bright}📚 Documentation:${COLORS.reset}`);
    console.log(`  • README.md - Project overview`);
    console.log(`  • .env.example - Environment variables template`);
    if (config.features.swagger) {
      console.log(`  • http://localhost:${config.port}/api-docs - API documentation`);
    }

    console.log(`\n${COLORS.green}${COLORS.bright}🚀 Your application will run on:${COLORS.reset}`);
    console.log(`   ${COLORS.underscore}http://localhost:${config.port}${COLORS.reset}\n`);

    console.log(`${COLORS.dim}Generated by create-web v${CONFIG.VERSION}${COLORS.reset}`);
    console.log(`${COLORS.dim}Need help? Check the README.md file${COLORS.reset}\n`);

    console.log(`${COLORS.bright}Happy coding! 💻✨${COLORS.reset}\n`);
  }

  cleanup() {
    this.cli.cleanup();
    this.logger.close();
  }
}

// ============================================================================
// ENHANCED TEMPLATES
// ============================================================================

const Templates = {
  // Enhanced app.js with error handling and security
  appJs: (config) => `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const routes = require('./routes');
${config.useDB !== 'None' ? "const db = require('./config/database');" : ''}
${config.features.authentication ? "const authMiddleware = require('./middleware/auth');" : ''}

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || ${config.port};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

${config.useEjs === 'EJS (Dynamic)' ? `// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));` : ''}

// Static files
app.use(express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

${config.useDB !== 'None' ? `// Database connection
db.connect()
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database error:', err.message));` : ''}

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).${config.useEjs === 'EJS (Dynamic)' ? "render('pages/404')" : "json({ error: 'Not Found' })"};
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    ${config.useDB !== 'None' ? 'db.disconnect();' : ''}
    process.exit(0);
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(\`
╔════════════════════════════════════════════╗
║  🚀 Server running on port \${PORT}
║  📝 Environment: \${process.env.NODE_ENV || 'development'}
║  🌐 URL: http://localhost:\${PORT}
${config.features.swagger ? "║  📚 API Docs: http://localhost:" + PORT + "/api-docs" : ''}
╚════════════════════════════════════════════╝
  \`);
});

module.exports = app;
`,

  // Enhanced database configuration with connection pooling
  databaseConfig: (dbType) => {
    if (dbType === 'MySQL') {
      return `const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydb',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000
});

// Test connection
const connect = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    throw error;
  }
};

// Query helper with error handling
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Graceful shutdown
const disconnect = async () => {
  try {
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
};

module.exports = {
  pool,
  connect,
  query,
  transaction,
  disconnect
};
`;
    } else if (dbType === 'PostgreSQL') {
      return `const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mydb',
  port: process.env.DB_PORT || 5432,
  max: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
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

const disconnect = async () => {
  await pool.end();
};

module.exports = { pool, connect, query, disconnect };
`;
    } else if (dbType === 'MongoDB') {
      return `const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'mydb';

let client;
let db;

const connect = async () => {
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
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

const disconnect = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB disconnected');
  }
};

module.exports = { connect, getDb, disconnect };
`;
    }
    return '';
  },

  // Enhanced authentication middleware
  authMiddleware: () => `const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'your-app-name'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

// Authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Authentication failed', 
      message: error.message 
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      req.user = verifyToken(token);
    }
    next();
  } catch (error) {
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authorize
};
`,

  // Rate limiting middleware
  rateLimiter: () => `const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Create account limiter
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many accounts created, please try again later'
});

module.exports = {
  apiLimiter,
  authLimiter,
  createAccountLimiter
};
`,

  // Enhanced .env template
  envTemplate: (config) => `# Application Configuration
NODE_ENV=development
PORT=${config.port}
APP_NAME=${config.projectName}
APP_URL=http://localhost:${config.port}

# Security
JWT_SECRET=${crypto.randomBytes(32).toString('hex')}
JWT_EXPIRES_IN=7d
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:${config.port}

${config.useDB === 'MySQL' ? `# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=${config.projectName.toLowerCase()}
DB_CONNECTION_LIMIT=10` : ''}

${config.useDB === 'PostgreSQL' ? `# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=${config.projectName.toLowerCase()}
DB_CONNECTION_LIMIT=10` : ''}

${config.useDB === 'MongoDB' ? `# MongoDB
MONGODB_URI=mongodb://localhost:27017
DB_NAME=${config.projectName.toLowerCase()}` : ''}

${config.features.fileUpload ? `# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./public/uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf` : ''}

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Email (if using email service)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-password

# External APIs
# API_KEY=your-api-key
`,

  // Enhanced package.json
  packageJson: (config) => {
    const deps = {
      "express": "^4.18.2",
      "cors": "^2.8.5",
      "dotenv": "^16.3.1",
      "helmet": "^7.1.0",
      "morgan": "^1.10.0"
    };

    if (config.useEjs === 'EJS (Dynamic)') deps["ejs"] = "^3.1.9";
    if (config.useDB === 'MySQL') deps["mysql2"] = "^3.6.5";
    if (config.useDB === 'PostgreSQL') deps["pg"] = "^8.11.3";
    if (config.useDB === 'MongoDB') deps["mongodb"] = "^6.3.0";
    if (config.features.authentication) deps["jsonwebtoken"] = "^9.0.2";
    if (config.security.includes('Standard') || config.security.includes('Advanced')) {
      deps["express-rate-limit"] = "^7.1.5";
    }
    if (config.features.fileUpload) deps["multer"] = "^1.4.5-lts.1";
    if (config.features.swagger) {
      deps["swagger-ui-express"] = "^5.0.0";
      deps["swagger-jsdoc"] = "^6.2.8";
    }

    const devDeps = {
      "nodemon": "^3.0.2"
    };

    if (config.features.linter) {
      devDeps["eslint"] = "^8.55.0";
      devDeps["prettier"] = "^3.1.1";
    }

    if (config.features.testing) {
      devDeps["jest"] = "^29.7.0";
      devDeps["supertest"] = "^6.3.3";
    }

    return JSON.stringify({
      "name": config.projectName.toLowerCase().replace(/\s+/g, '-'),
      "version": "1.0.0",
      "description": `A Node.js web application - ${config.projectName}`,
      "main": "src/app.js",
      "scripts": {
        "start": "node src/app.js",
        "dev": "nodemon src/app.js",
        "test": config.features.testing ? "jest --coverage" : "echo \"No tests specified\"",
        "lint": config.features.linter ? "eslint src/**/*.js" : "echo \"No linter configured\"",
        "format": config.features.linter ? "prettier --write \"src/**/*.js\"" : "echo \"No formatter configured\""
      },
      "keywords": ["nodejs", "express", "web", config.useEjs, config.useDB],
      "author": "",
      "license": "MIT",
      "dependencies": deps,
      "devDependencies": devDeps,
      "engines": {
        "node": ">=14.0.0",
        "npm": ">=6.0.0"
      }
    }, null, 2);
  }
};

// ============================================================================
// ERROR HANDLER
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

module.exports = { Application, Templates, Validator, Logger };