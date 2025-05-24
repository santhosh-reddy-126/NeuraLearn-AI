import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = "https://yaaanfgcidbukyosgvys.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWFuZmdjaWRidWt5b3NndnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTI3NDcsImV4cCI6MjA2Mjg2ODc0N30.NB3187950H3OSmeIArBg4qLLHk8t1k-8CSzd5LxOXOY"
const supabase = createClient(supabaseUrl, supabaseKey)
const routerc = Router()



function getDateOnly(startdate) {
     const parts = startdate.split('-');
     const year = parseInt(parts[0], 10);
     const month = parseInt(parts[1], 10) - 1;
     const day = parseInt(parts[2], 10);

     return new Date(year, month, day, 0, 0, 0, 0);
}

routerc.post("/addcurriculum", async (req, res) => {
     const { email, goal, duration, curriculum, startdate, count } = req.body;
     console.log(startdate);
     const dateOnly = new Date(startdate);
     dateOnly.setDate(dateOnly.getDate() + 1);
     dateOnly.setHours(0, 0, 0, 0);
     console.log(dateOnly);
     try {
          const { data, error } = await supabase.from("curriculum").insert([{ email: email, topic: goal, duration: duration, curriculum: curriculum, startdate: dateOnly, count: count }])
          if (error) {
               res.json({ success: false, message: "Unable to add Curriculum!" })
          }
          res.json({ success: true })

     } catch (e) {
          console.log(e)
          res.json({ success: false, message: "Unable to add Curriculum!" })
     }

})


routerc.post("/getcurriculum", async (req, res) => {
     const { email } = req.body;
     try {
          let { data, error } = await supabase.from("curriculum").select("*").eq("email", email);
          if (error) {
               return res.json({ success: false, message: "Unable to get Curriculum data!" })
          }
          let main_data = data;
          ({ data, error } = await supabase.from("daily_progress").select("*"));
          if (error) {
               return res.json({ success: false, message: "Unable to get Curriculum data!" })
          }
          let prog_data = data;

          ({ data, error } = await supabase
               .from('last_7_days_completed_count')
               .select('*'));

          if (error) console.error(error);

          let bar_data = data;
          ({ data, error } = await supabase
               .from('today_progress_summary')
               .select('*'));

          if (error) console.error(error);
          const { data: leaderboard, error:leaderboardError } = await supabase.rpc('get_top_leaderboard');

          if (leaderboardError) {
               console.error('Leaderboard fetch error:', leaderboardError);
          }
          res.json({ success: true, data: main_data, prog: prog_data, bar: bar_data, donut: data[0].total_completed_today,leaderboard: leaderboard })

     } catch (e) {
          console.log(e)
          res.json({ success: false, message: "Unable to get Curriculum data!" })
     }

})

routerc.post("/getcurriculumbyid", async (req, res) => {
     const { id } = req.body;
     try {
          let { data, error } = await supabase.from("curriculum").select("*").eq("id", id);

          if (error) {
               return res.json({ success: false, message: "Unable to get Curriculum data!" })
          }
          let main_data = data;
          ({ data, error } = await supabase.from("daily_progress").select("*").eq("curr_id", id));
          if (error) {
               return res.json({ success: false, message: "Unable to get Curriculum data!" })
          }
          res.json({ success: true, data: main_data, prog: data })

     } catch (e) {
          console.log(e)
          res.json({ success: false, message: "Unable to get Curriculum data!" })
     }

})


routerc.post("/marktopiccompleted", async (req, res) => {
     const { user_id, user_email, curr_id, topic, time_taken } = req.body;
     let myBadge = null;

     try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dateString = today.toLocaleDateString('en-CA');

          // 1. Fetch today's completed topics
          const { data: existingData, error: fetchError1 } = await supabase
               .from('daily_progress')
               .select('completed')
               .eq('user_id', user_id)
               .eq('curr_id', curr_id)
               .eq('date', dateString);

          if (fetchError1) {
               console.error(fetchError1);
               return res.json({ success: false, message: 'Error fetching completion data' });
          }

          const completed = existingData[0]?.completed || {};
          if (!(topic in completed)) {
               completed[topic] = time_taken;
          }

          // 2. Award XP using increment_column RPC
          const XP = existingData.length === 0 ? 20 : 10;
          const { data: xpData, error: xpError } = await supabase.rpc('increment_column', {
               table_name: 'Users',
               column_name: 'XP',
               increment_by: XP,
               where_condition: `id = ${user_id}`
          });

          if (xpError) {
               console.error(xpError);
               return res.json({ success: false, message: "Unable to add XP!" });
          }

          //3. Update or insert daily progress
          const updateProgress = existingData.length === 0
               ? supabase.from('daily_progress').insert([{ user_id, curr_id, completed, date: dateString }])
               : supabase.from('daily_progress').update({ completed })
                    .eq('user_id', user_id)
                    .eq('curr_id', curr_id)
                    .eq('date', dateString);

          const { error: updateError } = await updateProgress;
          if (updateError) {
               console.error(updateError);
               return res.json({ success: false, message: 'Error saving progress' });
          }
          let streakXP = 0;

          // 4. If first update today, handle streaks
          if (existingData.length === 0) {
               const yesterday = new Date(today);
               yesterday.setDate(yesterday.getDate() - 1);
               const dateStringYesterday = yesterday.toLocaleDateString('en-CA');

               const { data: prevDayData, error: prevError } = await supabase
                    .from('daily_progress')
                    .select('completed')
                    .eq('user_id', user_id)
                    .eq('curr_id', curr_id)
                    .eq('date', dateStringYesterday);

               if (prevError) {
                    console.error(prevError);
                    return res.json({ success: false, message: 'Error checking streak' });
               }

               if (prevDayData.length === 0) {
                    const { error: resetStreakError } = await supabase
                         .from('curriculum')
                         .update({ streak: 1 })
                         .eq('email', user_email)
                         .eq('id', curr_id);

                    if (resetStreakError) {
                         console.error(resetStreakError);
                         return res.json({ success: false, message: 'Error resetting streak' });
                    }
               } else {
                    const { data: streakOne, error: incrementStreakError } = await supabase.rpc('increment_column', {
                         table_name: 'curriculum',
                         column_name: 'streak',
                         increment_by: 1,
                         where_condition: `email = '${user_email}' AND id = ${curr_id}`
                    });

                    if (incrementStreakError) {
                         console.error(incrementStreakError);
                         return res.json({ success: false, message: 'Error incrementing streak' });
                    }
                    const { data: stats, error: statsError } = await supabase.rpc('get_user_learning_stats', {
                         p_user_id: user_id
                    });

                    if (statsError) {
                         console.error('Error fetching user learning stats:', error);
                         return res.json({ success: false, message: 'Failed to fetch stats' });
                    }


                    const streak = stats[0].streak;
                    const badges = stats[0].badges || [];

                    if (streak >= 30 && !badges.includes("Unstoppable")) {
                         myBadge = {
                              text: "Unstoppable",
                              emoji: "🚀🔥",
                              description: "30-day streak! You are truly unstoppable!"
                         };
                    } else if (streak >= 15 && !badges.includes("Streak Legend")) {
                         myBadge = {
                              text: "Streak Legend",
                              emoji: "🔥🏆",
                              description: "15-day streak! You're a legend in the making!"
                         };
                    } else if (streak >= 7 && !badges.includes("Streak Pro")) {
                         myBadge = {
                              text: "Streak Pro",
                              emoji: "🔥🔥🔥",
                              description: "7-day streak! You're on fire!"
                         };
                    } else if (streak >= 3 && !badges.includes("Streak Master")) {
                         myBadge = {
                              text: "Streak Master",
                              emoji: "🔥🔥",
                              description: "3-day streak! You're mastering consistency!"
                         };
                    } else if (streak >= 2 && !badges.includes("Streak Starter")) {
                         myBadge = {
                              text: "Streak Starter",
                              emoji: "🔥",
                              description: "2-day streak! You've started your streak journey!"
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


                    streakXP = 5 * (streakOne?.[0]?.after_value);

                    if (streakXP > 0) {
                         const { error: streakXpError } = await supabase.rpc('increment_column', {
                              table_name: 'Users',
                              column_name: 'XP',
                              increment_by: streakXP,
                              where_condition: `id = ${user_id}`
                         });

                         if (streakXpError) {
                              console.error(streakXpError);
                              return res.json({ success: false, message: 'Error adding streak XP' });
                         }
                    }
               }
          }

          // 5. Increment total completed count
          const { error: completeCountError } = await supabase.rpc('increment_column', {
               table_name: 'curriculum',
               column_name: 'completed_count',
               increment_by: 1,
               where_condition: `id = ${curr_id}`
          });

          if (completeCountError) {
               console.error(completeCountError);
               return res.json({ success: false, message: 'Error incrementing completed count' });
          }

          // 6. Check if new level passed
          const beforeXP = xpData?.[0]?.before_value ?? 0;
          const afterXP = xpData?.[0]?.after_value ?? 0;
          const passed = Math.floor(afterXP / 100) > Math.floor(beforeXP / 100)
               ? Math.floor(afterXP / 100)
               : 0;

          return res.json({ success: true, XP, passed, StreakXP: streakXP, myBadge });

     } catch (err) {
          console.error(err);
          return res.json({ success: false, message: 'Unable to mark topic as completed' });
     }
});



routerc.post("/analytics", async (req, res) => {
     const { user_id, curr_id } = req.body;
     try {
          let { data, error } = await supabase
               .rpc('get_quiz_summary', { curr_id_input: curr_id });

          if (error) {

               return res.json({ success: false, message: "Unable to delete Curriculum!" })
          }

          let main_data = data;

          ({ data, error } = await supabase
               .from("user_scores_history").select("score_array").eq("user_id", user_id).eq("curr_id", curr_id));

          if (error) {
               console.log(error)
               return res.json({ success: false, message: "Unable to delete Curriculum!" })
          }
          let linedata = data;
          ({ data, error } = await supabase
               .rpc('get_daily_progress_sum', { curr_id_input: curr_id }))

          if (error) {
               console.log(error)
               return res.json({ success: false, message: "Unable to delete Curriculum!" })
          }
          res.json({ success: true, data: main_data, linedata: linedata, read: data })

     } catch (e) {
          res.json({ success: false, message: "Unable to delete Curriculum!" })
     }

})



routerc.post("/deletecurriculum", async (req, res) => {
     const { id } = req.body;
     try {
          const { data, error } = await supabase.from("curriculum").delete("*").eq("id", id);
          if (error) {
               return res.json({ success: false, message: "Unable to delete Curriculum!" })
          }
          res.json({ success: true })

     } catch (e) {
          console.log(e)
          res.json({ success: false, message: "Unable to delete Curriculum!" })
     }

})
export default routerc;