// routes/userRoutes.js
const {Router} = require('express')
const {UserModel} = require('../db')
const { z } = require('zod')
const bcrypt = require('bcrypt')
const userRouter = Router()
const jwt = require('jsonwebtoken')
const {userMiddleware} = require('../middlewares/users')

userRouter.post('/signup', async function(req, res) {
    const requiredBody = z.object({
        firstname: z.string().regex(/^[A-Za-z]+$/).min(2).max(100),
        lastname: z.string().regex(/^[A-Za-z]+$/).min(2).max(100),
        password: z.string().min(2).max(100),
        email: z.string().email().min(2).max(100)
    });
    
    const parsedBody = requiredBody.safeParse(req.body);
    if(!parsedBody.success) {
        res.json(parsedBody.error);
        return;
    }

    const {firstname, lastname, email, password} = req.body;
    const hashedPassword = await bcrypt.hash(password, 5);
    
    try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
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