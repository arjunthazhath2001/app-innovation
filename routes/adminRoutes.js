// routes/adminRoutes.js
const {Router} = require('express')
const {AdminModel, UserModel} = require('../db')
const {adminMiddleware} = require('../middlewares/admin')
const adminRouter = Router()
const { z } = require('zod')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
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
            subject: 'Your OTP for Admin Authentication',
            text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
            html: `<p>Your OTP is: <strong>${otp}</strong>. It will expire in 10 minutes.</p>`
        });
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

adminRouter.post('/signup', async function(req, res) {
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
        // Check if admin already exists
        const existingAdmin = await AdminModel.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Email already in use" });
        }
        
        if (enable2fa) {
            // Generate OTP and set expiry time (10 minutes)
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            
            // Create admin with OTP
            await AdminModel.create({
                firstname,
                lastname,
                email,
                password: hashedPassword,
                enable2fa: true,
                otp,
                otpExpiry,
                isVerified: false
            });
            
            // Send OTP to admin's email
            await sendOTPEmail(email, otp);
            
            return res.json({ message: "OTP sent to email", require2fa: true });
        } else {
            // Create admin without OTP verification
            await AdminModel.create({
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

adminRouter.post('/verify-otp', async function(req, res) {
    const { email, otp } = req.body;
    
    try {
        const admin = await AdminModel.findOne({ email });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        // Check if OTP matches and hasn't expired
        if (admin.otp === otp && admin.otpExpiry > new Date()) {
            // Mark admin as verified
            admin.isVerified = true;
            admin.otp = null;
            admin.otpExpiry = null;
            await admin.save();
            
            return res.json({ verified: true, message: "OTP verified successfully" });
        } else {
            return res.status(400).json({ verified: false, message: "Invalid or expired OTP" });
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        return res.status(500).json({ message: "Verification failed" });
    }
});

adminRouter.post('/signin', async function(req, res) {
    const { email, password } = req.body;
    
    try {
        const admin = await AdminModel.findOne({ email });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        if (!admin.isVerified) {
            return res.status(403).json({ message: "Account not verified" });
        }
        
        const verified = await bcrypt.compare(password, admin.password);
        
        if (!verified) {
            return res.status(401).json({ message: "Wrong password" });
        }
        
        if (admin.enable2fa) {
            // Generate and send OTP
            const otp = generateOTP();
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
            
            admin.otp = otp;
            admin.otpExpiry = otpExpiry;
            await admin.save();
            
            await sendOTPEmail(email, otp);
            
            return res.json({ message: "OTP sent to email", require2fa: true });
        } else {
            // No 2FA, generate token directly
            const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_ADMIN);
            return res.json({ token, message: "Login successful" });
        }
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).json({ message: "Login failed" });
    }
});

adminRouter.post('/verify-login-otp', async function(req, res) {
    const { email, otp } = req.body;
    
    try {
        const admin = await AdminModel.findOne({ email });
        
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        // Check if OTP matches and hasn't expired
        if (admin.otp === otp && admin.otpExpiry > new Date()) {
            // Clear OTP after successful verification
            admin.otp = null;
            admin.otpExpiry = null;
            await admin.save();
            
            // Generate token
            const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET_ADMIN);
            return res.json({ token, message: "Login successful" });
        } else {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }
    } catch (error) {
        console.error('Login OTP verification error:', error);
        return res.status(500).json({ message: "Verification failed" });
    }
});

adminRouter.get('/profile', adminMiddleware, async function(req, res) {
    const adminId = req.userId;
    
    try {
        const admin = await AdminModel.findById(adminId).select('-password -otp -otpExpiry');
        
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
        const users = await UserModel.find().select('-password -otp -otpExpiry');
        return res.json({ users });
    } catch (error) {
        console.error('Users fetch error:', error);
        return res.status(500).json({ message: "Failed to fetch users" });
    }
});

module.exports = {
    adminRouter
}