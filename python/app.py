from flask import Flask, jsonify, request
from supabase import create_client, Client
import joblib
import numpy as np
from flask_cors import CORS
from bardapi import Bard
import os
import re,json,requests
import time




model = joblib.load("model.pkl")
SUPABASE_URL = "https://yaaanfgcidbukyosgvys.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhYWFuZmdjaWRidWt5b3NndnlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyOTI3NDcsImV4cCI6MjA2Mjg2ODc0N30.NB3187950H3OSmeIArBg4qLLHk8t1k-8CSzd5LxOXOY"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


Mistral_api_key = "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"
os.environ["_BARD_API_KEY"]="g.a000vAhY6vLMzSpgiKBt3_LQApd5o0A2FPT0NTvExDkAiDMEtJUbqutl_z_egHjVf20_dD2ETAACgYKAWASAQASFQHGX2Mi9vzzgYxDjcl-BU7_ncM-PRoVAUF8yKpyro2SrSnHsAoOdI4kF6p70076"
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

basic_query="if i ask any question provide explanation for whatever i ask in short and clear manner , also provide one short example if it is really complex concept. else respond accordingly also dont specify these requirements in the reply.  "




def generate_quiz_by_topics(topics, questions_per_topic=2):
    topic_list = ', '.join([f'"{topic}"' for topic in topics])
    prompt = (
        f"For each of the following topics: [{topic_list}], generate {questions_per_topic} multiple choice quiz questions per topic. "
        "Each question must have:\n"
        "- 4 options\n"
        "- 1 correct answer\n"
        "- A topic tag(specifying the question topic)\n"
        "Respond strictly in this JSON format:\n"
        "{'questions': [\n"
        "  {'topic': 'Topic Name', 'question': '', 'options': ['','','',''], 'answer': ''},\n"
        "  ...\n"
        "]}\n"
        "No extra text, no markdown. Only valid JSON output.dont include nextline symbols inside it.send a json parsed string"
    )

    try:
        response = Bard().get_answer(prompt).get("content")

        if response:
            temp=re.sub(r'^```json\s*|```$', '', response).strip()
            data = json.loads(temp)
            return data
        else:
            return None
    except Exception as e:
        print("Bard error:", e)
        return None
    
def get_cluster_message(cluster):
    if cluster == 0:
        return "You have a moderate score and spend less time on quizzes. Try dedicating a bit more time to improve your understanding and boost your scores!"
    elif cluster == 1:
        return "You spend quite a lot of time on quizzes but your scores are low. Focus on identifying difficult topics and practicing smarter, not just longer."
    elif cluster == 2:
        return "Great job! You spend a good amount of time studying and achieve high scores. Keep up the consistent effort!"
    elif cluster == 3:
        return "Excellent work! You’re scoring high while spending less time, indicating strong understanding and efficiency."
    elif cluster == 4:
        return "You spend a good amount of time on quizzes with moderate scores. Try focusing on weak areas to make your study time even more effective."
    elif cluster == 5:
        return "Your scores are low and time spent is limited. Consider increasing your study time and reviewing foundational concepts for better results."
    else:
        return "Invalid cluster value."

    

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    data = request.get_json()
    question = data.get('question', '')
    ans = Bard().get_answer(basic_query+"/n/n"+question).get('content')
    ans = re.sub(r'[*_#`>-]', '', ans)           
    ans = re.sub(r'\n+', ' ', ans)               
    ans = re.sub(r'\s{2,}', ' ', ans)   
    ans = ans.strip()
    return jsonify({"success":True,"answer": ans})

@app.route('/classify',methods=['POST'])
def classify():
    data = request.get_json()
    id = data.get('user_id', '')
    response = supabase.from_("user_avg_score_time").select("*").eq("user_id", id).execute()
    if(len(response.data)==0):
        return jsonify({"success":True,"data": "To view your performance insights, please take a few quizzes first. This helps us analyze your learning patterns and provide personalized feedback based on your scores and time spent."})
    
    avg_score = response.data[0]["avg_score"]
    avg_time = response.data[0]["avg_time_spent"]

    arr = np.array([[avg_score, avg_time]])
    cluster = model.predict(arr)
    

    return jsonify({"success":True,"data": get_cluster_message(cluster)})



from datetime import datetime

@app.route('/user-dashboard-data', methods=['POST'])
def user_dashboard_data():
    data = request.get_json()
    user_email = data.get('user_email')  
    user_id = data.get('user_id')
    curr_id = data.get('curr_id')
    streak_resp = supabase.from_("curriculum").select("streak").eq("id", curr_id).eq("email", user_email).single().execute()
    streak = streak_resp.data["streak"] if streak_resp.data else 0

    today = datetime.now().strftime('%Y-%m-%d')
    progress_resp = supabase.from_("daily_progress").select("*").eq("user_id", user_id).eq("curr_id", curr_id).eq("date", today).single().execute()
    todays_progress = progress_resp.data if progress_resp.data else {}
    todays_topics = todays_progress.get("completed", []) if todays_progress else []

    quiz_resp = supabase.from_("quiz").select("*").eq("user_id", user_id).eq("curr_id", curr_id).order("created_at", desc=True).limit(3).execute()
    last_quizzes = quiz_resp.data if quiz_resp.data else []
    prompt = f"""
    You are a supportive and intelligent learning coach. A user is using a daily part-time learning app. Based on their progress and recent activity, generate:

    1. A short motivational line.
    2. A helpful tip based on today's completed topics.
    3. An insight based on their recent quiz performance.

    User data:
    - Streak: {streak} days
    - Topics completed today: {todays_topics}
    - Quiz history (latest 3):
    """ + "\n".join(
        [f"  - Score: {q.get('score', '?')*100}% | Time taken: {q.get('timeSpent', '?')} sec" for q in last_quizzes]
    ) + """

    Respond as an array string:

    [Motivation,Tip,Insight]
    """ 

    ans = Bard().get_answer(prompt).get('content')
    clean_ans = ans.strip('`json').strip('`').strip()

    parsed_response = json.loads(clean_ans)
    motivation = parsed_response[0]
    tip = parsed_response[1]
    insight = parsed_response[2]

    data = {
        "motivation": motivation,
        "tip": tip,
        "insight": insight
    }

    return jsonify({"success":True,"data": data})



@app.route('/explain-topic', methods=['POST'])
def explain_topic():
    data = request.get_json()
    topic = data.get('topic', '')
    explain_prompt = (
    "You are an expert teacher. For any given topic from Math, Science, or Computer Science, explain it in simple language "
    "using the following JSON format only (no extra text), keeping the response within 2500 characters: "
    "\"def\" is a 1–3 line simple definition avoiding jargon; \"imp\" explains the importance and real-life use; "
    "\"comp\" is an array listing key components; \"steps\" is an array of objects each with \"title\" and \"content\" describing step-by-step explanations; "
    "\"ex\" gives an example or application; \"form\" is an array of objects each with \"type\" (either \"formula\" or \"syntax\") and \"content\" describing formulas or code syntax; "
    "\"mistakes\" is an array listing common mistakes to avoid; \"summary\" is a 2–3 line summary or takeaway. Use simple language, analogies, and code snippets if helpful. "
    "Now explain the topic:"
    )
         
    ans = Bard().get_answer(explain_prompt+topic).get('content')
    if ans:
        match= re.search(r"```json(.*?)```", ans, re.DOTALL)
        if match:
            json_str = match.group(1).strip()
            ans = json.loads(json_str)
            return jsonify({"success":True,"answer": ans})
        else:
            return jsonify({"success":False,"message": "Sorry! Unable to Identify Content"})
    else:

        return jsonify({"success":False,"message": "Sorry! Unable to Generate Curriculum"})


@app.route('/generate-curriculum', methods=['POST'])
def gen_curr():
    data = request.get_json()
    goal = data.get('goal', '')
    duration = data.get('duration', '')

    prompt = (
        f"You are an expert curriculum designer. Create a {duration}-day learning plan for {goal} "
        "in this JSON format only (no extra text): "
        "{'Day 1': {'Topic': '', 'Description': '', 'Subtopics': ['']}, 'Day 2': ...}. "
        "Use simple language, keep it short, structured, and well-formatted. "
        "Each day must have equal topics."
    )

    try:
        response = Bard().get_answer(prompt).get('content')

        if response:
            match = re.search(r"```json(.*?)```", response, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
            else:
                json_str = response.strip()

            try:
                curriculum = json.loads(json_str)
                return jsonify({"success": True, "data": curriculum})
            except json.JSONDecodeError:
                return jsonify({"success": False, "message": "Unable to parse JSON from Bard's response."})
        else:
            return jsonify({"success": False, "message": "Empty response from Bard."})
    except Exception as e:
        return jsonify({"success": False, "message": f"Bard error: {str(e)}"})

@app.route('/generate-quiz', methods=['POST'])
def gen_quiz():
    data = request.get_json()
    total, topics = int(data.get('total', 0)), data.get('topics', [])
    
    if not topics or total not in [15, 60]:
        return jsonify({"success": False, "message": "Invalid input"})

    qpt = 5 if total == 15 else 2
    chunks = [topics[i:i + 2] for i in range(0, len(topics), 2)] if qpt == 5 else [topics[i:i + 5] for i in range(0, len(topics), 5)]
    questions = []

    for chunk in chunks:
        res = generate_quiz_by_topics(chunk, qpt)
        
        if res:
            try:
                questions += res.get("questions", [])
            except json.JSONDecodeError:
                continue
    return jsonify({"success": True, "data": {"questions": questions[:total]}} if questions else {"success": False, "message": "Unable to generate questions."})

@app.route('/')
def home():
    return jsonify({"message": "Hello from NeuraLearn AI Python server!"})

if __name__ == '__main__':
    app.run(debug=True, port=5001)