import React, { useState } from "react";
import { python } from "../../../data";
import { toast } from "react-toastify";
import "./AskAIChat.css";

const AskAIChat = () => {
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    const user = JSON.parse(localStorage.getItem("user"))||{};
    setMessages(prev => [...prev, { sender: "user", text: chatInput }]);
    const currentInput = chatInput;
    setChatInput("");
    try {
      const resp = await fetch(python + "ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentInput,user_id: user?.id })
      });
      const data = await resp.json();
      if (data.success) {
        toast.info("+5XP Added!🎉")
        if(data.passed>0){
            toast.info(`Wohoo! Level ${data.passed+1} Reached🎉`);
        }
        setMessages(prev => [...prev, { sender: "AI", text: data.answer }]);
      }
    } catch (err) {
      console.log(err);
      toast.error('AI is busy Sleeping.');
    }
  };

  return (
    <>
      <button
        className="askai-fab"
        onClick={() => setShowChat(true)}
      >
        <span role="img" aria-label="ai">🤖</span> Ask AI
      </button>
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
    </>
  );
};

export default AskAIChat;