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



def generate_curriculum(goal, duration_days, api_key):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    prompt = f"Create a {duration_days}-day learning plan for {goal} in this JSON format: {{'Day 1': {{'Topic': '', 'Description': '', 'Subtopics': ['']}}}}. Keep explanations short. Do not include markdown or text outside JSON.days should be ordered correctly"

    data = {
        "model": "mistralai/mistral-small-3.1-24b-instruct:free",
        "messages": [
            {"role": "system", "content": "You are an expert curriculum designer for self-paced learners."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.7
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:
        result = response.json()
        curriculum_text = result['choices'][0]['message']['content']
        return curriculum_text
    else:
        print("Error:", response.status_code, response.text)
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

@app.route('/generate-curriculum', methods=['POST'])
def gen_curr():
    data = request.get_json()
    goal = data.get('goal', '')
    duration = data.get('duration', '')
    curriculum = generate_curriculum(goal, duration, Mistral_api_key)
    if curriculum:
        print(curriculum)
        match= re.search(r"```json(.*?)```", curriculum, re.DOTALL)
        if match:
            json_str = match.group(1).strip()
            curriculum = json.loads(json_str)
            return jsonify({"success":True,"data": curriculum})
        else:
            return jsonify({"success":False,"message": "Sorry! Unable to Identify Content"})
    else:

        return jsonify({"success":False,"message": "Sorry! Unable to Generate Curriculum"})

@app.route('/')
def home():
    return jsonify({"message": "Hello from NeuraLearn AI Python server!"})

if __name__ == '__main__':
    app.run(debug=True, port=5001)