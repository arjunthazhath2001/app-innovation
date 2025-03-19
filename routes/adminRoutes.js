// routes/adminRoutes.js
const {Router} = require('express')
const {AdminModel, UserModel} = require('../db')
const {adminMiddleware} = require('../middlewares/admin')
const adminRouter = Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

adminRouter.post('/signup', async function(req, res) {
    const {firstname, lastname, email, password} = req.body;
    
    // Basic validation without Zod
    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        // Check if admin already exists
        const existingAdmin = await AdminModel.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 5);
        
        // Create admin without OTP verification
        await AdminModel.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isVerified: true // Always verified since we removed OTP
        });
            
        return res.json({ message: "Admin account created successfully" });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: "Sign up failed" });
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
        
        // Generate token directly
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_ADMIN);
        return res.json({ token, message: "Login successful" });
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: "Login failed" });
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
        return res.status(500).json({ message: "Failed to fetch profile" });
    }
});

adminRouter.get('/users', adminMiddleware, async function(req, res) {
    try {
        const users = await UserModel.find().select('-password');
        return res.json({ users });
    } catch (error) {
        console.error('Users fetch error:', error);
        return res.status(500).json({ message: "Failed to fetch users" });
    }
});

module.exports = {
    adminRouter
}