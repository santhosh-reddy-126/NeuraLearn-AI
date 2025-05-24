import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://yaaanfgcidbukyosgvys.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWFuZmdjaWRidWt5b3NndnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTI3NDcsImV4cCI6MjA2Mjg2ODc0N30.NB3187950H3OSmeIArBg4qLLHk8t1k-8CSzd5LxOXOY"
const supabase = createClient(supabaseUrl, supabaseKey)
const test = Router()


test.post("/updateresult", async (req, res) => {
     try {
          let myBadge = null;
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

               if (!topics.includes(data[i].topic)) {
                    topics.push(data[i].topic)
               }
          }
          try {
               const { error } = await supabase.from("quiz").insert([{ user_id: user_id, curr_id: id, topics: topics, total: questions, correct: corrected, score: corrected / questions, review: review, timeSpent: time_spent }])
               if (error) {
                    return res.json({ success: false, message: "Unable to add Curriculum!" })
               }

               const { error: incrementError } = await supabase.rpc("increment_column", {
                    table_name: "curriculum",
                    column_name: "quiz_count",
                    increment_by: 1,
                    where_condition: `id = ${id}`
               });

               if (incrementError) {
                    return res.json({ success: false, message: "Unable to update quiz count!" });
               }

               const { data, error2 } = await supabase.rpc('increment_column', {
                    table_name: 'Users',
                    column_name: 'XP',
                    where_condition: `id = ${user_id}`,
                    increment_by: 20 + (corrected / questions == 1 ? 30 : (corrected / questions) >= 0.6 ? 20 : 0)
               });

               if (error2) {
                    return res.json({ success: false, message: "Unable to add XP!" })
               }

               const { data: stats, error: statsError } = await supabase.rpc('get_user_learning_stats', {
                    p_user_id: user_id
               });

               if (statsError) {
                    console.error('Error fetching user learning stats:', error);
                    return res.json({ success: false, message: 'Failed to fetch stats' });
               }





               if (stats[0].quiz_taken >= 10 && !stats[0].badges.includes("Quiz Marathoner")) {
                    myBadge = {
                         text: "Quiz Marathoner",
                         emoji: "🏃‍♂️📊",
                         description: "Completed 10 quizzes – unstoppable!"
                    };
               } else if (stats[0].quiz_taken >= 5 && !stats[0].badges.includes("Quiz Wiz")) {
                    myBadge = {
                         text: "Quiz Wiz",
                         emoji: "🧠",
                         description: "Completed 5 quizzes – sharp mind!"
                    };
               } else if (stats[0].quiz_taken >= 1 && !stats[0].badges.includes("First Quiz")) {
                    myBadge = {
                         text: "First Quiz",
                         emoji: "🥇",
                         description: "Completed your first quiz!"
                    };
               }


               if (myBadge != null) {
                    const { data: badgeData, error: badgeError } = await supabase
                         .rpc('add_badge_to_user', {
                              p_user_id: stats[0].id,
                              p_badge: myBadge.text
                         });

                    if (badgeError) {
                         console.error('Failed to add badge:', badgeError);
                    }
               }

               return res.json({ success: true, XP: (corrected / questions == 1 ? 30 : (corrected / questions) >= 0.6 ? 20 : 0), passed: Math.floor(data[0].after_value / 100) > Math.floor(data[0].before_value / 100) ? Math.floor(data[0].after_value / 100) : 0, myBadge })

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

          const main_data = data;

          ({ data, error } = await supabase
               .from("user_scores_history") // <-- your view name here
               .select("*")
               .eq("user_id", user_id));

          if (error) {
               return res.json({ success: false, message: "Unable to get analytics!" });
          }


          return res.json({ success: true, data: main_data, analytics: data })

     } catch (e) {
          console.log(e)
          return res.json({ success: false, message: "Unable to get Quiz!" })
     }

});

export default test;