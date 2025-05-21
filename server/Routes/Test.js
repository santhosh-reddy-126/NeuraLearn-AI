import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yaaanfgcidbukyosgvys.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWFuZmdjaWRidWt5b3NndnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTI3NDcsImV4cCI6MjA2Mjg2ODc0N30.NB3187950H3OSmeIArBg4qLLHk8t1k-8CSzd5LxOXOY"
const supabase = createClient(supabaseUrl, supabaseKey)
const test = Router()


test.post("/updateresult", async (req, res) => {
     try {
          let { data, id, user_id, time_spent } = req.body;
          const questions = data.length;
          let review = {};
          let topics = [];
          let corrected = 0;
          for (let i = 0; i < questions; i++) {
               if (data[i].answer === data[i].selected) {
                    corrected = corrected + 1;
               } else {
                    if (review[data[i].topic] === undefined) {
                         review[data[i].topic] = 1;
                    } else {
                         review[data[i].topic] = review[data[i].topic] + 1;
                    }
               }

               if(!topics.includes(data[i].topic)){
                    topics.push(data[i].topic)
               }
          }
          try {
               const { error } = await supabase.from("quiz").insert([{ user_id: user_id, curr_id: id, topics: topics, total: questions, correct: corrected, score: corrected / questions, review: review, timeSpent: time_spent }])
               if (error) {
                    return res.json({ success: false, message: "Unable to add Curriculum!" })
               }
               return res.json({ success: true })

          } catch (e) {
               console.log(e)
               return res.json({ success: false, message: "Unable to add Curriculum!" })
          }
     } catch (e) {
          console.log(e);
          res.status(500).json({ success: false, message: "Server error" });
     }
});


test.post("/getuserquizzes", async (req, res) => {

     try {
          const { user_id } = req.body;
          let { data, error } = await supabase
               .from("quiz")
               .select(`*,curriculum ( topic )`)
               .eq("user_id", user_id);

          if (error) {
               return res.json({ success: false, message: "Unable to get Quiz!" });
          }

          const main_data=data;

          ({ data, error } = await supabase
               .from("user_scores_history") // <-- your view name here
               .select("*")
               .eq("user_id", user_id));

          if (error) {
               return res.json({ success: false, message: "Unable to get analytics!" });
          }


          return res.json({ success: true, data: main_data,analytics: data })

     } catch (e) {
          console.log(e)
          return res.json({ success: false, message: "Unable to get Quiz!" })
     }

});

export default test;