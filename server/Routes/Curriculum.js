import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'


const supabaseUrl = "https://yaaanfgcidbukyosgvys.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWFuZmdjaWRidWt5b3NndnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTI3NDcsImV4cCI6MjA2Mjg2ODc0N30.NB3187950H3OSmeIArBg4qLLHk8t1k-8CSzd5LxOXOY"
const supabase = createClient(supabaseUrl, supabaseKey)
const routerc = Router()



function getDateOnly(startdate) {
     const parts = startdate.split('-'); // ["2025", "05", "01"]
     const year = parseInt(parts[0], 10);
     const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
     const day = parseInt(parts[2], 10);

     return new Date(year, month, day, 0, 0, 0, 0); // ← local time, midnight
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
               .from('daily_progress_summary')
               .select('*'));

          if (error) console.error(error);

          let bar_data = data;
          ({ data, error } = await supabase
               .from('today_progress_summary')
               .select('*'));

          if (error) console.error(error);
          res.json({ success: true, data: main_data, prog: prog_data, bar: bar_data, donut: data[0].total_completed_today })

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
     const { user_id, user_email, curr_id, topic } = req.body;

     try {
          const date = new Date();
          date.setHours(0, 0, 0, 0);

          const dateString = date.toLocaleDateString('en-CA');

          let { data, error: fetchError1 } = await supabase
               .from('daily_progress')
               .select('completed')
               .eq('user_id', user_id)
               .eq('curr_id', curr_id)
               .eq('date', dateString);

          if (fetchError1) {
               console.error(fetchError1);
               return res.json({ success: false, message: 'Error fetching completion data' });
          }

          let completed = data[0]?.completed || [];

          // If topic not already marked complete, add it
          if (!completed.includes(topic)) {
               completed.push(topic);
          }

          // Insert/update daily_progress
          const query = data.length === 0
               ? supabase.from('daily_progress').insert([{ user_id, curr_id, completed, date: dateString }])
               : supabase.from('daily_progress').update({ completed }).eq('user_id', user_id).eq('curr_id', curr_id).eq('date', dateString);

          const { error: fetchError2 } = await query;

          if (fetchError2) {
               console.error(fetchError2);
               return res.json({ success: false, message: 'Error updating completion data' });
          }

          // Only execute streak logic when inserting (i.e., first time for this date)
          if (data.length === 0) {
               const date2 = new Date(date);
               date2.setDate(date2.getDate() - 1);
               date2.setHours(0, 0, 0, 0);

               const dateString2 = date2.toLocaleDateString('en-CA');

               let { data: prevData, error: prevError } = await supabase
                    .from('daily_progress')
                    .select('completed')
                    .eq('user_id', user_id)
                    .eq('curr_id', curr_id)
                    .eq('date', dateString2);

               if (prevError) {
                    console.error(prevError);
                    return res.json({ success: false, message: 'Error fetching completion data' });
               }
               if (prevData.length == 0) {
                    const { error: streakError } = await supabase.from('curriculum').update({ streak: 1 }).eq('email', user_email).eq('id', curr_id);
                    if (streakError) {
                         console.error(streakError);
                         return res.json({ success: false, message: 'Error updating streak' });
                    }
               } else {
                    const { error: rpcError } = await supabase
                         .rpc('increment_streak', { p_id: curr_id, p_email: user_email });
                    if (rpcError) {
                         console.error(rpcError);
                         return res.json({ success: false, message: 'Error incrementing streak' });
                    }
               }
          }
          return res.json({ success: true });

     } catch (e) {
          console.error(e);
          res.json({ success: false, message: 'Unable to mark complete!' });
     }
});



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