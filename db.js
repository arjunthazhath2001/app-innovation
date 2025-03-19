const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    firstname: String,
    lastname: String,
    email: {type: String, unique: true},
    password: String,
    enable2fa: {type: Boolean, default: false},
    otp: String,
    otpExpiry: Date,
    isVerified: {type: Boolean, default: false}
})

const adminSchema = new Schema({
    firstname: String,
    lastname: String,
    email: {type: String, unique: true},
    password: String,
    enable2fa: {type: Boolean, default: false},
    otp: String,
    otpExpiry: Date,
    isVerified: {type: Boolean, default: false}
})

const UserModel = mongoose.model('user', userSchema)
const AdminModel = mongoose.model('admin', adminSchema)

module.exports = {
    UserModel,
    AdminModel
}