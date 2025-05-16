from flask import Flask, jsonify, request
from flask_cors import CORS
from bardapi import Bard
import os
import re
import time

os.environ["_BARD_API_KEY"]="g.a000vAhY6vLMzSpgiKBt3_LQApd5o0A2FPT0NTvExDkAiDMEtJUbqutl_z_egHjVf20_dD2ETAACgYKAWASAQASFQHGX2Mi9vzzgYxDjcl-BU7_ncM-PRoVAUF8yKpyro2SrSnHsAoOdI4kF6p70076"
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

basic_query="if i ask any question provide explanation for whatever i ask in short and clear manner , also provide one short example if it is really complex concept. , else respond accordingly"

@app.route('/ask-ai', methods=['POST'])
def ask_ai():
    print("ge")
    data = request.get_json()
    question = data.get('question', '')
    ans = Bard().get_answer(basic_query+"/n/n"+question).get('content')
    ans = re.sub(r'[*_#`>-]', '', ans)           # Remove *, _, #, `, >, -
    ans = re.sub(r'\n+', ' ', ans)               # Replace newlines with space
    ans = re.sub(r'\s{2,}', ' ', ans)            # Replace multiple spaces with single space
    ans = ans.strip()
    return jsonify({"success":True,"answer": ans})

@app.route('/')
def home():
    return jsonify({"message": "Hello from NeuraLearn AI Python server!"})

if __name__ == '__main__':
    app.run(debug=True, port=5001)