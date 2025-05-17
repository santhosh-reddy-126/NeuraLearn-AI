import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = "https://yaaanfgcidbukyosgvys.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWFuZmdjaWRidWt5b3NndnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTI3NDcsImV4cCI6MjA2Mjg2ODc0N30.NB3187950H3OSmeIArBg4qLLHk8t1k-8CSzd5LxOXOY"
const supabase = createClient(supabaseUrl, supabaseKey)
const routerc = Router()

routerc.post("/addcurriculum",async (req,res)=>{
     const {email,goal,duration,curriculum,startdate} = req.body;
     const dateOnly = new Date(startdate);
     dateOnly.setHours(0, 0, 0, 0);
     try{
          const {data,error} = await supabase.from("curriculum").insert([{email:email,topic: goal,duration: duration,curriculum: curriculum,startdate: dateOnly}])
          if(error){
               res.json({success: false,message: "Unable to add Curriculum!"})
          }
          res.json({success: true})
          
     }catch(e){
          console.log(e)
          res.json({success: false,message: "Unable to add Curriculum!"})
     }
     
})


routerc.post("/getcurriculum",async (req,res)=>{
     const {email} = req.body;
     try{
          const {data,error} = await supabase.from("curriculum").select("*").eq("email",email);
          if(error){
               return res.json({success: false,message: "Unable to get Curriculum data!"})
          }
          res.json({success: true,data: data})
          
     }catch(e){
          console.log(e)
          res.json({success: false,message: "Unable to get Curriculum data!"})
     }
     
})



routerc.post("/deletecurriculum",async (req,res)=>{
     const {id} = req.body;
     try{
          const {data,error} = await supabase.from("curriculum").delete("*").eq("id",id);
          if(error){
               return res.json({success: false,message: "Unable to delete Curriculum!"})
          }
          res.json({success: true})
          
     }catch(e){
          console.log(e)
          res.json({success: false,message: "Unable to delete Curriculum!"})
     }
     
})
export default routerc;