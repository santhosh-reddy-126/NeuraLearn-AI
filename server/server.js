import dotenv from 'dotenv';
dotenv.config();

import express from 'express'
import cors from 'cors'
import router from './Routes/User.js'
import routerc from './Routes/Curriculum.js'
import test from './Routes/Test.js'
import jwt from 'jsonwebtoken'




const app = express()
const PORT = process.env.PORT || 5000

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json())


const JWT_SECRET = process.env.JWT_SECRET || "neuralearn_secret_key"

export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] 

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' })
    }
    req.user = user 
    next()
  })
}
app.use('/api/user',router)
app.use('/api/curriculum',routerc)
app.use('/api/test',test);
app.get('/', (req, res) => {
  res.send('NeuraLearn AI server is running!')
})

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`)
})