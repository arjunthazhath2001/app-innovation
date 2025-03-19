// routes/userRoutes.js
const {Router} = require('express')
const {UserModel} = require('../db')
const bcrypt = require('bcrypt')
const userRouter = Router()
const jwt = require('jsonwebtoken')
const {userMiddleware} = require('../middlewares/users')

userRouter.post('/signup', async function(req, res) {
    const {firstname, lastname, email, password} = req.body;
    
    // Basic validation without Zod
    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 5);
        
        // Create user
        await UserModel.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isVerified: true // Always verified since we removed OTP
        });
            
        return res.json({ message: "Signed up successfully" });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: "Sign up failed" });
    }
});

userRouter.post('/signin', async function(req, res) {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    
    try {
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const verified = await bcrypt.compare(password, user.password);
        
        if (!verified) {
            return res.status(401).json({ message: "Wrong password" });
        }
        
        // Generate token directly
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_USER);
        return res.json({ token, message: "Login successful" });
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: "Login failed" });
    }
});

userRouter.get('/profile', userMiddleware, async function(req, res) {
    const userId = req.userId;
    
    try {
        const user = await UserModel.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.json({ user });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch profile" });
    }
});

module.exports = {
    userRouter
}