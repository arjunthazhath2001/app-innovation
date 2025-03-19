require('dotenv').config()
const express = require('express')
const {userRouter} = require('./routes/userRoutes')
const {adminRouter} = require('./routes/adminRoutes')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')

// Enable CORS
// In your backend index.js
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true
  }));


app.use(express.json())

app.use('/api/v1/users', userRouter)
app.use('/api/v1/admin', adminRouter)

// Serve static files from 'public' directory
app.use(express.static('public'))

async function main() {
    try {    
        await mongoose.connect(process.env.MONGODB_URL)
        console.log("DATABASE CONNECTION SUCCESSFUL")
    } catch(error) {
        console.log("DB CONNECTION FAILED", error)
    }
    
    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`)
    })
}

main()