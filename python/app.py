from dotenv import load_dotenv
import os

load_dotenv()
from flask import Flask, jsonify, request
from supabase import create_client, Client
import joblib
import numpy as np
import jwt
from flask_cors import CORS

from datetime import datetime

from bardapi import Bard
import re,json,requests
import time
import requests

def get_answer_from_bard(prompt):
    url = "https://bard-ii8v.onrender.com/ask"
    payload = {"question": prompt}
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status() 
        data = response.json()
        return data.get("answer", "No answer returned.")
    except Exception as e:
        return f"Error: {e}"

def get_cluster_feedback(cluster_number: int) -> dict:
    tips_data = {
        0: {
            "grade": "A",
            "tips": [
                "Great performance! Keep up your balanced study habits.",
                "Continue reviewing material regularly.",
                "You might help peers improve too."
            ]
        },
        1: {
            "grade": "E",
            "tips": [
                "Focus more on understanding concepts before quizzes.",
                "Try breaking study sessions into smaller, focused chunks.",
                "Analyze where you lose time in quizzes."
            ]
        },
        2: {
            "grade": "E",
            "tips": [
                "Your quiz scores are low. Rethink how you're studying.",
                "Consider using flashcards or active recall.",
                "Take more time reviewing before the quiz."
            ]
        },
        3: {
            "grade": "B",
            "tips": [
                "Good quiz performance! Keep improving efficiency.",
                "Try to slightly increase your study time.",
                "Regular revision can solidify this level."
            ]
        },
        4: {
            "grade": "D",
            "tips": [
                "Rethink your study strategy; it’s not effective.",
                "Consider practicing with mock quizzes.",
                "Break long study sessions into short bursts."
            ]
        },
        5: {
            "grade": "E",
            "tips": [
                "You study a lot but scores are low — quality over quantity!",
                "Change study methods — try teaching others.",
                "Use concept mapping for better retention."
            ]
        },
        6: {
            "grade": "B",
            "tips": [
                "You're doing well, but quiz time is high — try timed practice.",
                "Continue with active revision methods.",
                "Focus on speed along with accuracy."
            ]
        },
        7: {
            "grade": "E",
            "tips": [
                "Very low performance — revisit basics.",
                "Study in short, focused intervals.",
                "Watch tutorial videos for better understanding."
            ]
        },
        8: {
            "grade": "C",
            "tips": [
                "Moderate scores — try to improve retention.",
                "Add daily revision to your schedule.",
                "Practice low-stakes quizzes to build confidence."
            ]
        },
        9: {
            "grade": "B",
            "tips": [
                "Great scores! Reduce quiz time for efficiency.",
                "Consider simulating exam conditions.",
                "Keep reviewing material lightly before quizzes."
            ]
        },
    }
    return tips_data.get(cluster_number, {"grade": "Unknown", "tips": ["No data available."]})

weakness_model = joblib.load("weakness_model.pkl")
Scaler = joblib.load("Scaler.pkl")
def getInfo(study_time,quiz_score,quiz_time):
    start_data=np.array([study_time,quiz_score,quiz_time])
    start_data=start_data.reshape(1,-1)
    my_data = Scaler.transform(start_data)
    my_cluster=weakness_model.predict(my_data)
    return get_cluster_feedback(my_cluster[0])

model = joblib.load("model.pkl")
SUPABASE_URL = os.getenv("SUPA_URL")
SUPABASE_KEY = os.getenv("SUPA_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {"origins": os.getenv("CLIENT_URL","http://localhost:5173")}
})

basic_query="if i just give any topic to explain , Give explanation in small with one example and explain how that example matches the real defination or working.if its not just a topic to explain,Explain as your wish but in short only"

SECRET_KEY = os.getenv("JWT_SECRET", "neuralearn_secret_key")



import csv
import json
from io import StringIO
from bardapi import Bard  # Assuming you're using bardapi

def generate_quiz_by_topics(topics, questions_per_topic=2):
    topic_list = ', '.join([f'"{t}"' for t in topics])
    prompt = (
        f"Please provide {questions_per_topic * len(topics)} quiz questions on topics: {topic_list} "
        "as plain CSV text without any code block formatting or backticks. "
        "The CSV should have these columns: topic, question, option1, option2, option3, option4, answer. "
        "Do not include any extra line breaks inside fields, and do not wrap the CSV inside triple backticks or any other code formatting. "
        "Just give me plain CSV content. Give column names as the first row."
    )

    try:
        answer = get_answer_from_bard(prompt)
        csv_file = StringIO(answer)
        reader = csv.DictReader(csv_file)

        questions = []
        for row in reader:
            questions.append({
                "topic": row["topic"].strip(),
                "question": row["question"].strip(),
                "options": [row["option1"].strip(), row["option2"].strip(), row["option3"].strip(), row["option4"].strip()],
                "answer": row["answer"].strip()
            })

        return questions

    except Exception as e:
        print("Error generating questions:", e)
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
    user_id = data.get('user_id','')
    ans = get_answer_from_bard(basic_query+"/n/n"+question)
    ans = re.sub(r'[*_#`>-]', '', ans)           
    ans = re.sub(r'\n+', ' ', ans)               
    ans = re.sub(r'\s{2,}', ' ', ans)   
    ans = ans.strip()

    response = supabase.rpc(
        "increment_column",
        {
            "table_name": "Users",
            "column_name": "XP",
            "increment_by": 5,
            "where_condition": f"id={user_id}"
        }
        ).execute()
    xp_data = response.data[0]  # Supabase RPCs usually return a list of results

    before = xp_data.get("before_value", 0)
    after = xp_data.get("after_value", 0)

    # Determine if a level was passed (every 100 XP = new level)
    before_level = before // 100
    after_level = after // 100

    passed = after_level if after_level > before_level else 0

    return jsonify({"success":True,"answer": ans,"passed": passed})

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

@app.route("/weakness", methods=["POST"])
def weakness():
    data = request.get_json()

    if not data or "curr_id" not in data or "user_id" not in data:
        return jsonify({"error": "Please provide curr_id and user_id in the JSON body"}), 400

    curr_id = data.get("curr_id",'')
    user_id = data.get("user_id",'')

    study_data = {}
    study = supabase.table("daily_progress").select("*").eq("curr_id", curr_id).eq("user_id", user_id).execute().data

    for k in range(len(study)):
        study_data.update(study[k]["completed"])

    quiz_data = supabase.table("quiz").select("*").eq("curr_id", curr_id).eq("user_id", user_id).execute().data

    my_quiz = {}
    quiz_time = {}

    for i in range(len(quiz_data)):
        perTopic = quiz_data[i]["timeSpent"] / (quiz_data[i]["total"] / 5)
        for key in quiz_data[i]["topics"]:
            if quiz_data[i]["review"].get(key) is not None:
                my_quiz[key] = 1 - quiz_data[i]["review"][key] / 5
            else:
                my_quiz[key] = 1
            quiz_time[key] = perTopic

    result = []
    for topic in study_data:
        if topic in my_quiz and topic in quiz_time:
            result.append({
                topic: getInfo(study_data[topic], my_quiz[topic], quiz_time[topic])
            })

    response = supabase.rpc(
        "increment_column",
        {
            "table_name": "Users",
            "column_name": "XP",
            "increment_by": 5,
            "where_condition": f"id={user_id}"
        }
        ).execute()
    xp_data = response.data[0]  

    before = xp_data.get("before_value", 0)
    after = xp_data.get("after_value", 0)

    before_level = before // 100
    after_level = after // 100

    passed = after_level if after_level > before_level else 0



    return jsonify({"success":True,"data": result,"passed":passed})


@app.route('/user-dashboard-data', methods=['POST'])
def user_dashboard_data():
    try:
        data = request.get_json()
        user_email = data.get('user_email')  
        user_id = data.get('user_id')
        curr_id = data.get('curr_id')

        streak_resp = supabase.from_("curriculum").select("streak").eq("id", curr_id).eq("email", user_email).single().execute()
        streak = streak_resp.data["streak"] if streak_resp.data else 0

        today = datetime.now().strftime('%Y-%m-%d')
        progress_resp = supabase.from_("daily_progress").select("*").eq("user_id", user_id).eq("curr_id", curr_id).eq("date", today).limit(1).execute()
        todays_progress = progress_resp.data if progress_resp.data else []
        todays_topics = todays_progress[0].get("completed", []) if len(todays_progress) > 0 else []



        quiz_resp = supabase.from_("quiz").select("*").eq("user_id", user_id).eq("curr_id", curr_id).order("created_at", desc=True).limit(3).execute()
        last_quizzes = quiz_resp.data if quiz_resp.data else []



        if len(todays_topics)==0 and len(last_quizzes)==0:
            return jsonify({"success":False})

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



        ans = get_answer_from_bard(prompt)
        match = re.search(r"\[.*\]", ans, re.DOTALL)
        if not match:
            raise ValueError("Could not extract a valid list from the AI response.")

        clean_ans = match.group(0)


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
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Something went wrong!"}), 500


@app.route('/explain-topic', methods=['POST'])
def explain_topic():
    data = request.get_json()
    topic = data.get('topic', '')

    explain_prompt = (
        "You are an expert teacher. For any given topic from Math, Science, or Computer Science, explain it in simple language "
        "using the following JSON format only (no extra text), keeping the response strictly within 2400 characters: "
        "\"def\" is a 1–3 line simple definition avoiding jargon; \"imp\" explains the importance and real-life use; "
        "\"comp\" is an array listing key components; \"steps\" is an array of objects each with \"title\" and \"content\" describing step-by-step explanations; "
        "\"ex\" gives an example or application; \"form\" is an array of objects each with \"type\" (either \"formula\" or \"syntax\") and \"content\" describing formulas or code syntax; "
        "\"mistakes\" is an array listing common mistakes to avoid; \"summary\" is a 2–3 line summary or takeaway. Use simple language, analogies, and code snippets if helpful. "
        "Also include one relevant YouTube video with title and URL, and one relevant article with title and URL in the response. make sure they are existing right now."
        "Respond with only valid JSON in a ```json block, no explanation or markdown. Now explain the topic within 2400 characters:"
    )

    try:
        raw_ans = get_answer_from_bard(explain_prompt + topic)

        match = re.search(r"```json\s*(.*?)\s*```", raw_ans, re.DOTALL | re.IGNORECASE)
        json_str = match.group(1).strip() if match else raw_ans

        ans_json = json.loads(json_str)

        required_keys = {"def", "imp", "comp", "steps", "ex", "form", "mistakes", "summary"}
        if not required_keys.issubset(ans_json.keys()):
            raise ValueError("Missing keys in JSON")

        return jsonify({"success": True, "answer": ans_json})

    except (json.JSONDecodeError, ValueError) as e:
        return jsonify({
            "success": False,
            "message": "Failed to generate Content.",
            "error": str(e),
            "raw": raw_ans
        })


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
        "Each day must have equal topics.Each day can have maximum of 3 topics only.No topic should have (,) in name"
    )

    try:
        response = get_answer_from_bard(prompt)

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

    if not topics:
        return jsonify({"success": False, "message": "Invalid input"})

    qpt = 5
    expected_total = qpt * len(topics)

    questions = generate_quiz_by_topics(topics, qpt)
    print(questions)

    if not questions or not isinstance(questions, list):
        return jsonify({"success": False, "message": "Failed to generate quiz. Try again later."})

    # Count how many questions we have per topic
    topic_counts = {topic: 0 for topic in topics}
    for q in questions:
        topic = q.get("topic")
        if topic in topic_counts:
            topic_counts[topic] += 1

    for topic, count in topic_counts.items():
        if count < qpt:
            return jsonify({"success": False, "message": f"Not enough questions for topic '{topic}'. Try again later."})

    return jsonify({"success": True, "questions": questions})






    return jsonify({
        "success": True,
        "data": {"questions": all_questions[:total]},
        "message": "Unable to generate enough questions. Try Again" if len(all_questions) < total else "Generated full quiz!"
    })


@app.route('/')
def home():
    return jsonify({"message": "Hello from NeuraLearn AI Python server!"})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
