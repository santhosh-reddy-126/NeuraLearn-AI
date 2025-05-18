from flask import Flask, jsonify, request
from flask_cors import CORS
from bardapi import Bard
import os
import re,json,requests
import time


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