import dotenv from 'dotenv';
dotenv.config();

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPA_URL
const supabaseKey = process.env.SUPA_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || "neuralearn_secret_key"

router.post('/signup', async (req, res) => {
     const {name,email,password,avatar} = req.body;
     try{
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password,salt);
          const exist = await supabase.from('Users').select('*').eq('email',email).single();
          if(exist && exist.data) {
              return res.json({success:false,message:"Email already exists"});
          }

          const {data,error} = await supabase.from('Users').insert([{name,email,password:hashedPassword,avatar}]);
          if(error) throw new Error("Error in creating user");
          res.json({success: true,message:"User created successfully"});
     }catch(e){
          console.log(e);
          res.status(500).json({success:false,message: "Server error"});
     }
})

router.post('/login', async (req, res) => {
     const {email,password} = req.body;
     try{
          const exist = await supabase.from('Users').select('*').eq('email',email).single();
          if(!exist.data) {
               return res.json({success:false,message:"User does not exist"})
          }

          const validPassword = await bcrypt.compare(password,exist.data.password);
          if(!validPassword) {
               return res.json({success:false,message:"Invalid credentials"})
          }

          const token = jwt.sign(
            { id: exist.data.id, email: exist.data.email, name: exist.data.name },
            JWT_SECRET,
            { expiresIn: '6h'}
          );

          res.json({
            success:true,
            message:"Successfully logged in",
            token,
            user: {
              id: exist.data.id,
              name: exist.data.name,
              email: exist.data.email,
              avatar: exist.data.avatar
            }
          });
     }catch(e){
          console.log(e);
          res.status(500).json({success:false,message: "Server error"});
     }
})



router.post('/getXP', async (req, res) => {
     const {id} = req.body;
     try{
          const data = await supabase.from('Users').select('*').eq('id',id).single();
          res.json({
            success:true,
            XP: data.data.XP,
            badges: data.data.badges
          });
     }catch(e){
          console.log(e);
          res.status(500).json({success:false,message: "Server error"});
     }
})

export default router;