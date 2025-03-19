// routes/userRoutes.js
const {Router} = require('express')
const {UserModel} = require('../db')
const bcrypt = require('bcrypt')
const userRouter = Router()
const jwt = require('jsonwebtoken')
const {userMiddleware} = require('../middlewares/users')

userRouter.post('/signup', async function(req, res) {
    console.log('User signup request received:', req.body);
    
    const {firstname, lastname, email, password} = req.body;
    
    // Basic validation without Zod
    if (!firstname || !lastname || !email || !password) {
        console.log('Validation failed:', { firstname, lastname, email, password: password ? 'provided' : 'missing' });
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            console.log('User already exists with email:', email);
            return res.status(400).json({ message: "Email already in use" });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 5);
        console.log('Password hashed successfully');
        
        // Create user
        const newUser = await UserModel.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isVerified: true // Always verified since we removed OTP
        });
        
        console.log('User created successfully:', newUser._id);
            
        return res.json({ message: "Signed up successfully" });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: "Sign up failed", error: error.message });
    }
});

userRouter.post('/signin', async function(req, res) {
    console.log('User signin request received:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ message: "Email and password are required" });
    }
    
    try {
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(404).json({ message: "User not found" });
        }
        
        const verified = await bcrypt.compare(password, user.password);
        
        if (!verified) {
            console.log('Password verification failed for:', email);
            return res.status(401).json({ message: "Wrong password" });
        }
        
        // Generate token directly
        console.log('Generating token with secret:', process.env.JWT_SECRET_USER ? 'Secret exists' : 'Secret missing');
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_USER);
        console.log('Login successful for:', email);
        return res.json({ token, message: "Login successful" });
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: "Login failed", error: error.message });
    }
});

userRouter.get('/profile', userMiddleware, async function(req, res) {
    console.log('Profile request received, user ID:', req.userId);
    
    const userId = req.userId;
    
    try {
        const user = await UserModel.findById(userId).select('-password');
        
        if (!user) {
            console.log('User not found with ID:', userId);
            return res.status(404).json({ message: "User not found" });
        }
        
        console.log('Profile request successful for user:', user._id);
        return res.json({ user });
    } catch (error) {
        console.error('Profile fetch error:', error);
        return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
});

module.exports = {
    userRouter
}