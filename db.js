const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    firstname: String,
    lastname: String,
    email: {type: String, unique: true},
    password: String,
    isVerified: {type: Boolean, default: true}
})

const adminSchema = new Schema({
    firstname: String,
    lastname: String,
    email: {type: String, unique: true},
    password: String,
    isVerified: {type: Boolean, default: true}
})

const UserModel = mongoose.model('user', userSchema)
const AdminModel = mongoose.model('admin', adminSchema)

module.exports = {
    UserModel,
    AdminModel
}