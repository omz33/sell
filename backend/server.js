const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const morgan = require('morgan');
const winston = require('winston');
const bcrypt = require('bcryptjs');

const app = express();
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sell', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
.catch((err) => {
    logger.error("MongoDB connection error", err);
    process.exit(1);
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});
app.use(morgan(":method :url :status :response-time ms - :res[content-length]"));

const apilogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration} ms`,
            params: req.params,
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined
        });
    });
    next();
};
app.use(apilogger);

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('Users', userSchema);
// تعريف مخطط المنتج
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    images: [String], // قائمة صور
    owner: { type: String, required: true } // البريد الإلكتروني لمالك المنتج
});

const Product = mongoose.model('Product', productSchema);

// إضافة منتج جديد
app.post('/api/products', async (req, res) => {
    try {
        const { name, description, price, images, owner } = req.body;
        const newProduct = new Product({ name, description, price, images, owner });
        await newProduct.save();
        res.status(201).json({ message: 'تمت إضافة المنتج بنجاح', product: newProduct });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة المنتج', error: error.message });
    }
});

// جلب جميع المنتجات
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب المنتجات', error: error.message });
    }
});

// حذف المنتج (يجب أن يكون المالك هو الذي يحذف المنتج)
app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });

        await product.deleteOne();
        res.status(200).json({ message: 'تم حذف المنتج بنجاح' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في حذف المنتج', error: error.message });
    }
});

// API لجلب المنتجات الخاصة بمستخدم معين
app.get('/api/user/products', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
        }

        const userProducts = await Product.find({ owner: email });
        res.status(200).json(userProducts);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب منتجات المستخدم', error: error.message });
    }
});


// تسجيل مستخدم جديد
app.post('/api/signup', async (req, res) => {
    try {
        const { firstName, lastName, userName, email, password } = req.body;
        
        // التحقق من عدم وجود المستخدم مسبقًا
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'هذا البريد الإلكتروني مستخدم بالفعل' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ firstName, lastName, userName, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'تم تسجيل المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// تسجيل الدخول
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'البريد الإلكتروني غير صحيح' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'كلمة المرور غير صحيحة' });
        }

        res.status(200).json({ message: 'تم تسجيل الدخول بنجاح', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.use(express.static(path.join(__dirname, '../frontend')));

// Route to serve login.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
