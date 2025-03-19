// routes/userRoutes.js
const {Router} = require('express')
const {UserModel} = require('../db')
const bcrypt = require('bcrypt')
const userRouter = Router()
const jwt = require('jsonwebtoken')
const {userMiddleware} = require('../middlewares/users')

userRouter.post('/signup', async function(req, res) {
    const {firstname, lastname, email, password} = req.body;
    
    if (!firstname || !lastname || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    
    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 5);
        
        const newUser = await UserModel.create({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            isVerified: true
        });
            
        return res.json({ message: "Signed up successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Sign up failed", error: error.message });
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
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_USER);
        return res.json({ token, message: "Login successful" });
    } catch (error) {
        return res.status(500).json({ message: "Login failed", error: error.message });
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
        return res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
});

module.exports = {
    userRouter
}