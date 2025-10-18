# 🚀 Create-Web CLI

<div align="center">

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**The fastest way to create a Node.js web application with Express, EJS, and MySQL!**

</div>

---

## ✨ Features

- 🎨 **Interactive CLI** - Beautiful interface with arrow key navigation
- ⚡ **Fast Setup** - Generate complete project structure in seconds
- 🎯 **Smart Templates** - Pre-configured Express.js boilerplate
- 🗄️ **Database Ready** - MySQL integration out of the box
- 📦 **Auto Install** - Automatically installs all dependencies
- 🎭 **EJS Support** - Choose between EJS templates or plain HTML
- 🎨 **Modern UI** - Beautiful CSS styling included
- 📝 **Best Practices** - Follows Node.js project structure standards
- 🔒 **Security First** - Includes .env for sensitive data
- 📚 **Well Documented** - Complete README and code comments

---

## 📦 Installation

### **Global Installation (Recommended)**

```bash
npm install -g create-web
```

### **Using NPX (No Installation)**

```bash
npx create-web nodejs
```

### **From Source**

```bash
git clone https://github.com/yourusername/create-web.git
cd create-web
npm link
```

---

## 🚀 Quick Start

### **1. Create a new project**

```bash
create-web nodejs
```

### **2. Answer the prompts**

```
📝 Project name: my-app
🎨 Use EJS template engine? Yes/No
🗄️  Choose database: MySQL/None
```

### **3. Navigate and start**

```bash
cd my-app
npm run dev
```

### **4. Open browser**

Visit `http://localhost:3000` 🎉

---

## 🎯 Usage Examples

### **Create a simple HTML project**

```bash
$ create-web nodejs

📝 Project name: simple-website
🎨 Use EJS template engine? → No
🗄️  Choose database? → None

✅ Project created!
```

### **Create a full-stack app with database**

```bash
$ create-web nodejs

📝 Project name: fullstack-app
🎨 Use EJS template engine? → Yes
🗄️  Choose database? → MySQL

✅ Project created with EJS + MySQL!
```

---

## 📁 Project Structure

### **With EJS + MySQL**

```
my-app/
├── 📂 src/
│   ├── 📂 services/
│   │   ├── 📄 db.js              # MySQL connection
│   │   └── 📄 auth.js            # Authentication service
│   ├── 📂 routes/
│   │   └── 📄 index.js           # API routes
│   └── 📄 app.js                 # Express configuration
│
├── 📂 views/
│   ├── 📂 components/
│   │   ├── 📄 header.ejs         # Reusable header
│   │   └── 📄 footer.ejs         # Reusable footer
│   └── 📂 pages/
│       ├── 📄 home.ejs           # Home page
│       ├── 📄 login.ejs          # Login page
│       └── 📄 contact.ejs        # Contact page
│
├── 📂 public/
│   ├── 📂 css/
│   │   └── 📄 main.css           # Styling
│   ├── 📂 js/
│   │   └── 📄 main.js            # Client JavaScript
│   ├── 📂 images/
│   └── 📂 uploads/
│
├── 📄 .env                        # Environment variables
├── 📄 .gitignore                  # Git ignore rules
├── 📄 package.json                # Dependencies
└── 📄 README.md                   # Documentation
```

### **Without EJS (Plain HTML)**

```
my-app/
├── 📂 src/
│   ├── 📂 services/
│   │   ├── 📄 dataset.json       # JSON data (if no DB)
│   │   └── 📄 auth.js
│   ├── 📂 routes/
│   │   └── 📄 index.js
│   ├── 📂 components/
│   │   ├── 📄 header.js          # Header component
│   │   └── 📄 footer.js          # Footer component
│   ├── 📂 pages/
│   │   ├── 📄 home.html
│   │   ├── 📄 login.html
│   │   └── 📄 contact.html
│   └── 📄 app.js
│
├── 📂 public/
│   ├── 📂 css/
│   ├── 📂 js/
│   ├── 📂 images/
│   └── 📂 uploads/
│
├── 📄 .env
├── 📄 .gitignore
├── 📄 package.json
└── 📄 README.md
```

---

## 📦 What's Included?

### **Dependencies**
- ✅ **express** - Fast web framework
- ✅ **cors** - Cross-origin resource sharing
- ✅ **dotenv** - Environment variables
- ✅ **ejs** - Template engine (optional)
- ✅ **mysql2** - MySQL client (optional)
- ✅ **nodemon** - Auto-restart server (dev)

### **Features**
- ✅ Pre-configured Express app
- ✅ Route handlers with examples
- ✅ Database connection setup
- ✅ Authentication service with JWT
- ✅ Modern CSS styling
- ✅ Responsive design
- ✅ Error handling
- ✅ Environment configuration
- ✅ Git ready (.gitignore)
- ✅ Complete documentation

---

## ⚙️ Configuration

### **Environment Variables (.env)**

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key

# MySQL (if selected)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=mydb
DB_PORT=3306
```

### **Available Scripts**

```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
```

---

## 🎨 Customization

### **Change Styling**
Edit `public/css/main.css` to customize the look and feel.

### **Add Routes**
Add new routes in `src/routes/index.js`:

```javascript
router.get('/about', (req, res) => {
  res.render('pages/about', { title: 'About Us' });
});
```

### **Database Queries**
Use the database connection in `src/services/db.js`:

```javascript
const db = require('./services/db');

router.get('/users', async (req, res) => {
  const [users] = await db.query('SELECT * FROM users');
  res.json(users);
});
```

---

## 🔧 Troubleshooting

### **Command not found**
```bash
npm link
# or
npm install -g create-web
```

### **Permission denied (Linux/Mac)**
```bash
chmod +x index.js
# or
sudo npm link
```

### **Port already in use**
Change the PORT in `.env` file:
```env
PORT=4000
```

### **MySQL connection error**
1. Make sure MySQL is running
2. Check credentials in `.env`
3. Create database: `CREATE DATABASE mydb;`

---

## 📚 Examples

### **API Endpoint Example**

```javascript
// GET /api/users
router.get('/api/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users
router.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
    res.status(201).json({ success: true, message: 'User created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### **Authentication Example**

```javascript
const { authMiddleware } = require('./services/auth');

// Protected route
router.get('/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

---

## 🛣️ Roadmap

- [ ] TypeScript support
- [ ] PostgreSQL support
- [ ] MongoDB support
- [ ] Tailwind CSS option
- [ ] Docker configuration
- [ ] Testing setup (Jest/Mocha)
- [ ] CI/CD templates
- [ ] GraphQL support
- [ ] WebSocket support
- [ ] Microservices architecture

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Developer Dewa Program**

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- Inspired by create-react-app
- Built with ❤️ and Node.js
- Thanks to the open-source community

---

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/create-web?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/create-web?style=social)
![npm downloads](https://img.shields.io/npm/dt/create-web)

---

<div align="center">

**⭐ Star this repo if you find it helpful! ⭐**

**Made with 💙 by developers, for developers**

[Report Bug](https://github.com/yourusername/create-web/issues) · [Request Feature](https://github.com/yourusername/create-web/issues) · [Documentation](https://github.com/yourusername/create-web/wiki)

</div>

---

### Quick Links

- 📖 [Full Documentation](https://github.com/yourusername/create-web/wiki)
- 🎥 [Video Tutorial](https://youtube.com)
- 💬 [Discord Community](https://discord.gg)
- 🐦 [Twitter](https://twitter.com)

**Happy Coding! 🚀✨**# Devweb
