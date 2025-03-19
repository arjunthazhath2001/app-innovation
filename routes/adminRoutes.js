// routes/adminRoutes.js
const {Router} = require('express')
const {AdminModel, UserModel} = require('../db')
const {adminMiddleware} = require('../middlewares/admin')
const adminRouter = Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

adminRouter.post('/signup', async function(req, res) {
    console.log('Admin signup request received:', req.body);
    
    const {firstname, lastname, email, password} = req.body;
    
    // Basic validation without Zod
    if (!firstname || !lastname || !email || !password) {
        console.log('Validation failed:', { firstname, lastname, email, password: password ? 'provided' : 'missing' });
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        // Check if admin already exists
        const existingAdmin = await AdminModel.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists with email:', email);
            return res.status(400).json({ message: "Email already in use" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 5);
        console.log('Password hashed successfully');
        
        // Create admin without OTP verification
        const newAdmin = await AdminModel.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isVerified: true // Always verified since we removed OTP
        });
        
        console.log('Admin created successfully:', newAdmin._id);
            
        return res.json({ message: "Admin account created successfully" });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: "Sign up failed", error: error.message });
    }
});

adminRouter.post('/signin', async function(req, res) {
    console.log('Admin signin request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: "Email and password are required" });
    }
    
    try {
        const admin = await AdminModel.findOne({ email });
        
        if (!admin) {
            console.log('Admin not found with email:', email);
            return res.status(404).json({ message: "Admin not found" });
        }
        
        const verified = await bcrypt.compare(password, admin.password);
        
        if (!verified) {
            console.log('Password verification failed for:', email);
            return res.status(401).json({ message: "Wrong password" });
        }
        
        // Generate token directly
        console.log('Generating token with secret:', process.env.JWT_SECRET_ADMIN ? 'Secret exists' : 'Secret missing');
        const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_ADMIN);
        console.log('Login successful for admin:', email);
        return res.json({ token, message: "Login successful" });
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: "Login failed", error: error.message });
    }
});

adminRouter.get('/profile', adminMiddleware, async function(req, res) {
    console.log('Profile request received, admin ID:', req.userId);
    
    const adminId = req.userId;
    
    try {
        const admin = await AdminModel.findById(adminId).select('-password');
        
        if (!admin) {
            console.log('Admin not found with ID:', adminId);
            return res.status(404).json({ message: "Admin not found" });
        }
        
        console.log('Profile request successful for admin:', admin._id);
        return res.json({ user: admin });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
});

adminRouter.get('/users', adminMiddleware, async function(req, res) {
    console.log('Users list request received, admin ID:', req.userId);
    
    try {
        const users = await UserModel.find().select('-password');
        console.log(`Retrieved ${users.length} users`);
        return res.json({ users });
    } catch (error) {
        console.error('Users fetch error:', error);
        return res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
});

module.exports = {
    adminRouter
}