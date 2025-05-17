import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Dashboard.css";
import { backend, python } from "../../../data";
import { toast } from "react-toastify";
import axios from "axios";
import Loading from "../../Components/Loading/Loading";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const name = user.name || "User";
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [curr, allcurr] = useState([]);
  const getCurriculum = async (e) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user.email;

      const resp = await axios.post(backend + "api/curriculum/getcurriculum", {
        email: email
      });
      if (!resp.data.success) {
        toast.success("Unable to get Curriculum!")
      } else {

        allcurr(resp.data.data);
      }
    } catch (e) {
      console.log(e);
    }
  }
  const handleSend = async (e) => {
    e.preventDefault();
    console.log(python);
    if (chatInput.trim() === "") return;
    setMessages(prev => [...prev, { sender: "user", text: chatInput }]);
    const currentInput = chatInput;
    setChatInput("");
    try {
      const resp = await axios.post(python + "ask-ai", {
        question: currentInput
      });
      if (resp.data.success) {
        setMessages(prev => [...prev, { sender: "AI", text: resp.data.answer }]);
      }
    } catch (err) {
      console.log(err);
      toast.error('AI is busy Sleeping.');
    }
  };


  useEffect(() => {
    getCurriculum();
  }, [])
  return (
    <div>
      <Navbar />
      <div className="dashboard-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "3rem" }}>
        <h1 className="dashboard-title">Welcome, {name}!</h1>
        <div className="curriculums">
          {curr
            .filter(item => {
              const now = new Date();
              const start = new Date(item.startdate);
              const end = new Date(start.getTime() + item.duration * 24 * 60 * 60 * 1000);
              return start <= now && now <= end;
          })
            .map((item, index) => (
              <div key={index} className="day-card">
                <h4>Day {1+Math.floor((new Date() - new Date(item.startdate)) / (1000 * 60 * 60 * 24))} of {item.topic}</h4>
              </div>
            ))}
        </div>
      </div>
      {/* Floating Ask AI Button */}
      <button
        className="askai-fab"
        onClick={() => setShowChat(true)}
      >
        <span role="img" aria-label="ai">🤖</span> Ask AI
      </button>
      {/* Chatbox Modal */}
      {showChat && (
        <div className="askai-chatbox-overlay" onClick={() => setShowChat(false)}>
          <div className="askai-chatbox" onClick={e => e.stopPropagation()}>
            <div className="askai-chatbox-header">
              <span>NeuraLearn AI Chat</span>
              <button className="askai-chatbox-close" onClick={() => setShowChat(false)}>×</button>
            </div>
            <div className="askai-chatbox-body">
              <div className="askai-messages">
                {messages.length === 0 && (
                  <p style={{ color: "#888", textAlign: "center" }}>Start the conversation!</p>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={msg.sender === "user" ? "askai-message user" : "askai-message ai"}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
              <form className="askai-chatbox-input-row" onSubmit={handleSend}>
                <input
                  className="askai-chatbox-input"
                  type="text"
                  placeholder="Type your message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  autoFocus
                />
                <button className="askai-chatbox-send" type="submit">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;