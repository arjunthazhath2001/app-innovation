// routes/adminRoutes.js
const {Router} = require('express')
const {AdminModel, UserModel} = require('../db')
const {adminMiddleware} = require('../middlewares/admin')
const adminRouter = Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

adminRouter.post('/signup', async function(req, res) {
    const {firstname, lastname, email, password} = req.body;
    
    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        const existingAdmin = await AdminModel.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 5);
        
        const newAdmin = await AdminModel.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isVerified: true
        });
            
        return res.json({ message: "Admin account created successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Sign up failed", error: error.message });
    }
});

adminRouter.post('/signin', async function(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    
    try {
        const admin = await AdminModel.findOne({ email });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        const verified = await bcrypt.compare(password, admin.password);
        
        if (!verified) {
            return res.status(401).json({ message: "Wrong password" });
        }
        
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_ADMIN);
        return res.json({ token, message: "Login successful" });
    } catch (error) {
        return res.status(500).json({ message: "Login failed", error: error.message });
    }
});

adminRouter.get('/profile', adminMiddleware, async function(req, res) {
    const adminId = req.userId;
    
    try {
        const admin = await AdminModel.findById(adminId).select('-password');
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        return res.json({ user: admin });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
});

adminRouter.get('/users', adminMiddleware, async function(req, res) {
    try {
        const users = await UserModel.find().select('-password');
        return res.json({ users });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
});

module.exports = {
    adminRouter
}