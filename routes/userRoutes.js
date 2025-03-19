// routes/userRoutes.js
const {Router} = require('express')
const {UserModel} = require('../db')
const { z } = require('zod')
const bcrypt = require('bcrypt')
const userRouter = Router()
const jwt = require('jsonwebtoken')
const {userMiddleware} = require('../middlewares/users')
const nodemailer = require('nodemailer')

// Configure nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email, otp) {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP for Authentication',
            text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
            html: `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
        });
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

userRouter.post('/signup', async function(req, res) {
    const requiredBody = z.object({
        firstname: z.string().regex(/^[A-Za-z]+$/).min(2).max(100),
        lastname: z.string().regex(/^[A-Za-z]+$/).min(2).max(100),
        password: z.string().min(2).max(100),
        email: z.string().email().min(2).max(100),
        enable2fa: z.boolean().optional()
    });
    
    const parsedBody = requiredBody.safeParse(req.body);
    if(!parsedBody.success) {
        res.json(parsedBody.error);
        return;
    }

    const {firstname, lastname, email, password, enable2fa = false} = req.body;
    const hashedPassword = await bcrypt.hash(password, 5);
    
    try {
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
        if (enable2fa) {
            // Generate OTP and set expiry time (10 minutes)
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            
            // Create user with OTP
            await UserModel.create({
                firstname,
                lastname,
                email,
                password: hashedPassword,
                enable2fa: true,
                otp,
                otpExpiry,
                isVerified: false
            });
            
            // Send OTP to user's email
            await sendOTPEmail(email, otp);
            
            return res.json({ message: "OTP sent to email", require2fa: true });
        } else {
            // Create user without OTP verification
            await UserModel.create({
                firstname,
                lastname,
                email,
                password: hashedPassword,
                enable2fa: false,
                isVerified: true
            });
            
            return res.json({ message: "Signed up" });
        }
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: "Sign up failed" });
    }
});

userRouter.post('/verify-otp', async function(req, res) {
    const { email, otp } = req.body;
    
    try {
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if OTP matches and hasn't expired
        if (user.otp === otp && user.otpExpiry > new Date()) {
            // Mark user as verified
            user.isVerified = true;
            user.otp = null;
            user.otpExpiry = null;
            await user.save();
            
            return res.json({ verified: true, message: "OTP verified successfully" });
        } else {
            return res.status(400).json({ verified: false, message: "Invalid or expired OTP" });
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({ message: "Verification failed" });
    }
});

userRouter.post('/signin', async function(req, res) {
    const { email, password } = req.body;
    
    try {
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.isVerified) {
            return res.status(403).json({ message: "Account not verified" });
        }
        
        const verified = await bcrypt.compare(password, user.password);
        
        if (!verified) {
            return res.status(401).json({ message: "Wrong password" });
        }
        
        if (user.enable2fa) {
            // Generate and send OTP
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
            
            await sendOTPEmail(email, otp);
            
            return res.json({ message: "OTP sent to email", require2fa: true });
        } else {
            // No 2FA, generate token directly
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_USER);
            return res.json({ token, message: "Login successful" });
        }
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: "Login failed" });
    }
});

userRouter.post('/verify-login-otp', async function(req, res) {
    const { email, otp } = req.body;
    
    try {
        const user = await UserModel.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // Check if OTP matches and hasn't expired
        if (user.otp === otp && user.otpExpiry > new Date()) {
            // Clear OTP after successful verification
            user.otp = null;
            user.otpExpiry = null;
            await user.save();
            
            // Generate token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_USER);
            return res.json({ token, message: "Login successful" });
        } else {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
    } catch (error) {
        console.error('Login OTP verification error:', error);
        return res.status(500).json({ message: "Verification failed" });
    }
});

userRouter.get('/profile', userMiddleware, async function(req, res) {
    const userId = req.userId;
    
    try {
        const user = await UserModel.findById(userId).select('-password -otp -otpExpiry');
        
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