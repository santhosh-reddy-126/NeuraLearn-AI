import React, { useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Dashboard.css";
import { backend, python } from "../../../data";
import { toast } from "react-toastify";
import axios from "axios";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const name = user.name || "User";
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);

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

  return (
    <div>
      <Navbar />
      <div className="dashboard-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "3rem" }}>
        <h1 className="dashboard-title">Welcome, {name}!</h1>
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