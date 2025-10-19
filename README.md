# 🚀 DevWeb - Professional Node.js Web Generator

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![NPM](https://img.shields.io/badge/npm-%3E%3D6.0.0-red.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)

**The most advanced CLI tool to scaffold production-ready Node.js web applications in seconds!**

[🌟 Features](#-features) • [📦 Installation](#-installation) • [🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## ✨ Features

### **Core Features**
- 🎨 **Beautiful Interactive CLI** - Intuitive interface with real-time validation
- ⚡ **Lightning Fast** - Generate complete project in under 30 seconds
- 🏗️ **Professional Architecture** - Industry-standard project structure
- 🔒 **Security First** - Built-in security best practices (Helmet, CORS, JWT)
- 📦 **Smart Installation** - Automatic dependency management
- 🎯 **Zero Configuration** - Works out of the box
- 🔄 **Rollback Support** - Automatic cleanup on failure
- 📊 **Detailed Logging** - Comprehensive error tracking

### **Template Options**
- 🎭 **EJS Templates** - Dynamic server-side rendering
- 📄 **Static HTML** - Simple static websites
- 🎯 **API Only** - RESTful API development

### **Database Support**
- 🐬 **MySQL/MariaDB** - With connection pooling
- 🐘 **PostgreSQL** - Advanced SQL database
- 🍃 **MongoDB** - NoSQL document database
- ⚪ **No Database** - Lightweight applications

### **Additional Features**
- 🔐 **JWT Authentication** - Ready-to-use auth system
- 🎨 **Modern UI** - Beautiful gradient design with responsive layout
- 📝 **ESLint + Prettier** - Code quality and formatting
- 🧪 **Testing Setup** - Jest testing framework (optional)
- 🐳 **Docker Support** - Containerization ready (optional)
- 📚 **API Documentation** - Swagger/OpenAPI integration (optional)
- 🔄 **Git Ready** - Pre-configured .gitignore and git init
- 📊 **Health Checks** - Built-in monitoring endpoints

---

## 📦 Installation

### **Method 1: NPM Global Install (Recommended)**

```bash
npm install -g devweb
```

### **Method 2: NPX (No Installation)**

```bash
npx devweb
```

### **Method 3: From Source**

```bash
git clone https://github.com/AibyIlannn/Devweb.git
cd Devweb
npm install
npm link
```

### **Verify Installation**

```bash
devweb --version
# Output: 2.0.0
```

---

## 🚀 Quick Start

### **Create Your First Project**

```bash
# Run the generator
devweb

# Follow the interactive prompts
📝 Project name: my-awesome-app
🎨 Use EJS template engine? (Y/n): Y
🗄️  Use database? (mysql/postgresql/mongodb/none): mysql
🔐 Add authentication (JWT)? (Y/n): Y
📋 Add ESLint + Prettier? (Y/n): Y
🔌 Server port (default: 3000): 3000
📦 Initialize git repository? (Y/n): Y

# Navigate to project
cd my-awesome-app

# Install dependencies (if not auto-installed)
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev

# Open browser
# Visit http://localhost:3000
```

### **Project Ready in 3 Commands!**

```bash
devweb              # Generate project
cd my-awesome-app   # Navigate to project
npm run dev         # Start server 🎉
```

---

## 📁 Project Structure

### **Full Structure (EJS + MySQL + Auth)**

```
my-awesome-app/
│
├── 📂 src/
│   ├── 📄 app.js                 # Express app configuration
│   ├── 📄 server.js              # Server entry point
│   │
│   ├── 📂 config/
│   │   └── 📄 database.js        # Database connection & pooling
│   │
│   ├── 📂 middleware/
│   │   ├── 📄 auth.js            # JWT authentication
│   │   ├── 📄 validation.js      # Input validation
│   │   └── 📄 errorHandler.js    # Error handling
│   │
│   ├── 📂 routes/
│   │   ├── 📄 index.js           # Main routes
│   │   ├── 📄 auth.js            # Auth routes
│   │   └── 📄 api.js             # API routes
│   │
│   ├── 📂 services/
│   │   ├── 📄 userService.js     # User business logic
│   │   └── 📄 emailService.js    # Email service
│   │
│   └── 📂 utils/
│       ├── 📄 logger.js          # Logging utility
│       └── 📄 helpers.js         # Helper functions
│
├── 📂 views/
│   ├── 📂 layouts/
│   │   ├── 📄 header.ejs         # Reusable header
│   │   └── 📄 footer.ejs         # Reusable footer
│   │
│   ├── 📂 pages/
│   │   ├── 📄 index.ejs          # Home page
│   │   ├── 📄 404.ejs            # Error page
│   │   ├── 📄 login.ejs          # Login page
│   │   └── 📄 dashboard.ejs      # Dashboard
│   │
│   └── 📂 components/
│       ├── 📄 navbar.ejs         # Navigation
│       └── 📄 card.ejs           # Card component
│
├── 📂 public/
│   ├── 📂 css/
│   │   └── 📄 style.css          # Modern gradient styling
│   │
│   ├── 📂 js/
│   │   └── 📄 main.js            # Client-side JavaScript
│   │
│   ├── 📂 images/
│   │   └── 📄 logo.png
│   │
│   └── 📂 uploads/
│       └── 📄 .gitkeep
│
├── 📂 tests/
│   ├── 📄 app.test.js            # App tests
│   └── 📄 auth.test.js           # Auth tests
│
├── 📂 logs/
│   └── 📄 app.log                # Application logs
│
├── 📄 .env                        # Environment variables
├── 📄 .env.example                # Environment template
├── 📄 .gitignore                  # Git ignore rules
├── 📄 .eslintrc.json              # ESLint config
├── 📄 .prettierrc                 # Prettier config
├── 📄 package.json                # Dependencies
├── 📄 README.md                   # Documentation
└── 📄 Dockerfile                  # Docker config (optional)
```

---

## ⚙️ Configuration

### **Environment Variables (.env)**

```env
# =================================
# APPLICATION CONFIGURATION
# =================================
NODE_ENV=development
PORT=3000
APP_NAME=my-awesome-app
APP_URL=http://localhost:3000

# =================================
# SECURITY
# =================================
JWT_SECRET=<auto-generated-secure-key>
JWT_EXPIRES_IN=7d
SESSION_SECRET=<auto-generated-secure-key>
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000

# =================================
# DATABASE - MySQL
# =================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=my_awesome_app
DB_CONNECTION_LIMIT=10

# =================================
# DATABASE - PostgreSQL
# =================================
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# DB_NAME=my_awesome_app
# DB_CONNECTION_LIMIT=10

# =================================
# DATABASE - MongoDB
# =================================
# MONGODB_URI=mongodb://localhost:27017
# DB_NAME=my_awesome_app

# =================================
# FILE UPLOAD
# =================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./public/uploads
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# =================================
# LOGGING
# =================================
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# =================================
# EMAIL (Optional)
# =================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password

# =================================
# EXTERNAL APIS (Optional)
# =================================
# API_KEY=your-api-key
# API_SECRET=your-api-secret
```

---

## 📦 Dependencies

### **Production Dependencies**
```json
{
  "express": "^4.18.2",         // Web framework
  "cors": "^2.8.5",             // CORS middleware
  "dotenv": "^16.3.1",          // Environment variables
  "helmet": "^7.1.0",           // Security headers
  "morgan": "^1.10.0",          // HTTP logger
  "ejs": "^3.1.9",              // Template engine (optional)
  "mysql2": "^3.6.5",           // MySQL client (optional)
  "pg": "^8.11.3",              // PostgreSQL client (optional)
  "mongodb": "^6.3.0",          // MongoDB client (optional)
  "jsonwebtoken": "^9.0.2",     // JWT authentication (optional)
  "bcryptjs": "^2.4.3",         // Password hashing (optional)
  "express-validator": "^7.0.1" // Input validation (optional)
}
```

### **Development Dependencies**
```json
{
  "nodemon": "^3.0.2",          // Auto-restart
  "eslint": "^8.55.0",          // Linting (optional)
  "prettier": "^3.1.1",         // Code formatting (optional)
  "jest": "^29.7.0",            // Testing (optional)
  "supertest": "^6.3.3"         // API testing (optional)
}
```

---

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run lint:fix         # Fix linting issues

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Database
npm run db:migrate       # Run migrations (if configured)
npm run db:seed          # Seed database (if configured)
```

---

## 🔌 API Endpoints

### **Health & Status**
```http
GET /health              # Health check
GET /api/status          # API status
```

### **Authentication (if enabled)**
```http
POST /api/auth/register  # Register user
POST /api/auth/login     # Login user
POST /api/auth/logout    # Logout user
GET  /api/auth/me        # Get current user
```

### **Example Endpoints**
```http
GET    /api/data         # Get data
POST   /api/data         # Create data
PUT    /api/data/:id     # Update data
DELETE /api/data/:id     # Delete data
```

---

## 🎨 Customization Guide

### **1. Add New Routes**

```javascript
// src/routes/blog.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('pages/blog', { 
    title: 'Blog',
    posts: [] 
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  // Fetch post by id
  res.render('pages/post', { post: {} });
});

module.exports = router;

// src/app.js - Register route
app.use('/blog', require('./routes/blog'));
```

### **2. Create Database Models**

```javascript
// src/models/User.js
const db = require('../config/database');

class User {
  static async findAll() {
    const [users] = await db.query('SELECT * FROM users');
    return users;
  }

  static async findById(id) {
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ?', 
      [id]
    );
    return users[0];
  }

  static async create(userData) {
    const { name, email, password } = userData;
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    return result.insertId;
  }

  static async update(id, userData) {
    const [result] = await db.query(
      'UPDATE users SET ? WHERE id = ?',
      [userData, id]
    );
    return result.affectedRows;
  }

  static async delete(id) {
    const [result] = await db.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  }
}

module.exports = User;
```

### **3. Add Middleware**

```javascript
// src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

module.exports = limiter;

// Use in app.js
app.use('/api/', limiter);
```

### **4. Customize Styling**

```css
/* public/css/style.css */
:root {
  --primary: #667eea;
  --secondary: #764ba2;
  --success: #2ecc71;
  --danger: #e74c3c;
  --dark: #2c3e50;
}

/* Override default styles */
.hero {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.btn-primary {
  background: var(--primary);
  transition: transform 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}
```

---

## 🔒 Security Best Practices

### **Included Security Features**
- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Cross-origin protection
- ✅ **JWT** - Secure authentication
- ✅ **Input Validation** - SQL injection prevention
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **HTTPS Ready** - SSL/TLS support

### **Additional Recommendations**

```javascript
// Enable HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Strong password requirements
const passwordSchema = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialCharacters: true
};
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Command not found**
```bash
# Solution 1: Reinstall globally
npm install -g devweb

# Solution 2: Use NPX
npx devweb

# Solution 3: Check PATH
echo $PATH
npm config get prefix
```

#### **2. Permission denied (Linux/Mac)**
```bash
# Fix permissions
sudo chown -R $USER:$(id -gn $USER) ~/.npm
sudo chown -R $USER:$(id -gn $USER) /usr/local/lib/node_modules

# Or use NPX
npx devweb
```

#### **3. Port already in use**
```bash
# Find process using port
lsof -i :3000        # Mac/Linux
netstat -ano | findstr :3000   # Windows

# Kill process or change port in .env
PORT=4000
```

#### **4. Database connection failed**

**MySQL:**
```bash
# Check MySQL is running
sudo service mysql status        # Linux
brew services list              # Mac
net start MySQL80               # Windows

# Test connection
mysql -u root -p

# Create database
CREATE DATABASE my_awesome_app;
GRANT ALL PRIVILEGES ON my_awesome_app.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

**PostgreSQL:**
```bash
# Check PostgreSQL is running
sudo service postgresql status   # Linux
brew services list              # Mac

# Test connection
psql -U postgres

# Create database
CREATE DATABASE my_awesome_app;
```

**MongoDB:**
```bash
# Check MongoDB is running
sudo service mongod status      # Linux
brew services list              # Mac

# Test connection
mongosh
```

#### **5. npm install fails**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Use legacy peer deps if needed
npm install --legacy-peer-deps
```

#### **6. EJS template not rendering**
```bash
# Check views directory path in app.js
app.set('views', path.join(__dirname, '../views'));

# Check file extension
app.set('view engine', 'ejs');

# Verify file exists
ls views/pages/
```

---

## 📚 Examples & Tutorials

### **Example 1: Simple Blog API**

```javascript
// src/routes/blog.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const [posts] = await db.query(
      'SELECT * FROM posts ORDER BY created_at DESC'
    );
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single post
router.get('/posts/:id', async (req, res) => {
  try {
    const [posts] = await db.query(
      'SELECT * FROM posts WHERE id = ?',
      [req.params.id]
    );
    
    if (posts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    res.json({ success: true, data: posts[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create post
router.post('/posts', async (req, res) => {
  const { title, content, author } = req.body;
  
  try {
    const [result] = await db.query(
      'INSERT INTO posts (title, content, author) VALUES (?, ?, ?)',
      [title, content, author]
    );
    
    res.status(201).json({ 
      success: true, 
      id: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update post
router.put('/posts/:id', async (req, res) => {
  const { title, content } = req.body;
  
  try {
    const [result] = await db.query(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?',
      [title, content, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM posts WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### **Example 2: User Authentication**

```javascript
// src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken, authenticate } = require('../middleware/auth');
const db = require('../config/database');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    // Generate token
    const token = generateToken({ 
      id: result.insertId, 
      email 
    });
    
    res.status(201).json({ 
      success: true, 
      token,
      user: { id: result.insertId, name, email }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    const user = users[0];
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = generateToken({ 
      id: user.id, 
      email: user.email 
    });
    
    res.json({ 
      success: true, 
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email 
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user (protected route)
router.get('/me', authenticate, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🚀 Deployment

### **Heroku**

```bash
# Login to Heroku
heroku login

# Create app
heroku create my-awesome-app

# Add database (if needed)
heroku addons:create jawsdb:kitefin  # MySQL
heroku addons:create heroku-postgresql  # PostgreSQL

# Deploy
git push heroku main

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key

# Open app
heroku open
```

### **Docker**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build image
docker build -t my-awesome-app .

# Run container
docker run -p 3000:3000 --env-file .env my-awesome-app
```

### **DigitalOcean / VPS**

```bash
# Connect to server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/my-awesome-app.git
cd my-awesome-app

# Install dependencies
npm install --production

# Install PM2
npm install -g pm2

# Start app
pm2 start src/server.js --name my-awesome-app

# Setup startup script
pm2 startup
pm2 save

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/my-awesome-app
```

---

## 🛣️ Roadmap

### **Version 2.1 (Coming Soon)**
- [ ] TypeScript template option
- [ ] GraphQL API template
- [ ] WebSocket support
- [ ] Redis integration
- [ ] AWS S3 file upload
- [ ] Email templates
- [ ] Social authentication

### **Version 2.2**
- [ ] Microservices architecture
- [ ] Kubernetes configuration
- [ ] CI/CD pipeline templates
- [ ] Performance monitoring
- [ ] Advanced logging (Winston, ELK)
- [ ] Multi-language support
- [ ] Admin dashboard generator

### **Version 3.0**
- [ ] React/Vue/Angular frontend integration
- [ ] Mobile app templates (React Native)
- [ ] Blockchain integration
- [ ] AI/ML model integration
- [ ] Real-time collaboration features
- [ ] Payment gateway integration
- [ ] Multi-tenancy support

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### **Ways to Contribute**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository
- 📢 Share with others

### **Development Setup**

```bash
# Fork the repository
git clone https://github.com/yourusername/Devweb.git
cd Devweb

# Install dependencies
npm install

# Create a branch
git checkout -b feature/amazing-feature

# Make changes and test
npm link
devweb  # Test your changes

# Commit changes
git add .
git commit -m "Add amazing feature"

# Push to GitHub
git push origin feature/amazing-feature

# Create Pull Request on GitHub
```

### **Coding Guidelines**
- Follow existing code style
- Add comments for complex logic
- Update documentation
- Add tests for new features
- Use meaningful commit messages

---

## 📝 License

MIT License

Copyright (c) 2024 DevWeb

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👨‍💻 Author

**Aiby Ilann - Senior Full Stack Developer**

- 🌐 GitHub: [@AibyIlannn](https://github.com/AibyIlannn)
- 📧 Email: aibyilann@example.com
- 💼 LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- 🐦 Twitter: [@yourtwitter](https://twitter.com/yourtwitter)

---

## 🙏 Acknowledgments

- Inspired by **create-react-app**, **Express Generator**, and modern CLI tools
- Thanks to the **Node.js** and **Express.js** communities
- Special thanks to all **contributors** and **users**
- Built with ❤️ by developers, for developers

---

## 📊 Project Stats

![GitHub Stars](https://img.shields.io/github/stars/AibyIlannn/Devweb?style=social)
![GitHub Forks](https://img.shields.io/github/forks/AibyIlannn/Devweb?style=social)
![GitHub Issues](https://img.shields.io/github/issues/AibyIlannn/Devweb)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/AibyIlannn/Devweb)
![NPM Downloads](https://img.shields.io/npm/dt/devweb)
![GitHub Last Commit](https://img.shields.io/github/last-commit/AibyIlannn)

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

**Made with 💙 by developers, for developers**

[Report Bug](https://github.com/aibyilannn/create-web/issues) · [Request Feature](https://github.com/aibyilannn/create-web/issues) · [Documentation](https://github.com/aibyilannn/create-web/wiki)

</div>

---

### Quick Links

- 📖 [Full Documentation](https://github.com/aibyilannn/create-web/wiki)
- 🎥 [Video Tutorial](https://youtube.com)
- 💬 [Discord Community](https://discord.gg)
- 🐦 [Twitter](https://twitter.com)

**Happy Coding! 🚀✨**# Devweb
