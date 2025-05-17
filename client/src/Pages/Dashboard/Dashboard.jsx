import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Dashboard.css";
import { backend } from "../../../data";
import { toast } from "react-toastify";
import axios from "axios";
import AskAIChat from "../../Components/AskAIChat/AskAIChat"; // <-- Import your AskAIChat component

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const name = user.name || "User";
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
      {/* Ask AI Chat Floating Button and Modal */}
      <AskAIChat />
    </div>
  );
};

export default Dashboard;