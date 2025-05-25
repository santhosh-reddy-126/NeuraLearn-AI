import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Dashboard.css";
import { backend, checkToken, python } from "../../../data";
import { toast } from "react-toastify";
import axios from "axios";
import { resolvePath, useNavigate } from "react-router-dom";
import BarChartComponent from "../../Components/Charts/BarChartComponent";
import AskAIChat from "../../Components/AskAIChat/AskAIChat";
import DonutChart from "../../Components/Charts/DonutChart";
import Loading from "../../Components/Loading/Loading"; 

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const name = user.name || "User";
  const [users, setUsers] = useState([]);
  const nav = useNavigate();
  const [curr, allcurr] = useState([]);
  const [bar, setbar] = useState({});
  const [donut, Setdonut] = useState({
    completed: 0,
    total: 0
  });
  const [classificationMsg, setClassificationMsg] = useState("");
  const [loading, setLoading] = useState(true); 

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };
  const classifyUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.post(python + "classify", {
        user_id: getUserId()
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (!resp.data.success) {
        toast.error("Unable to classify");
      } else {
        setClassificationMsg(resp.data.data || "");
      }
    } catch (e) {
      console.error("Classification error:", e);
      setClassificationMsg("");
    }
  };

  const calculateDonut = (dataList) => {
    let total = 0;

    dataList.forEach(item => {
      const day = 1 + Math.floor((new Date() - new Date(item.startdate)) / (1000 * 60 * 60 * 24));
      if (item.curriculum[`Day ${day}`]) {
        total += item.curriculum[`Day ${day}`].Subtopics.length;
      }
    });

    Setdonut({
      total,
      completed: 0
    });
  };


  const getCurriculum = async (e) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user.email;
      const user_id = user.id;
      const token = localStorage.getItem("token");

      const resp = await axios.post(
        backend + "api/curriculum/getcurriculum",
        {
          email: email,
          userId: user_id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!resp.data.success) {
        toast.success("Unable to get Curriculum!");
      } else {
        allcurr(resp.data.data);
        setbar(resp.data.bar);
        setUsers(resp.data.leaderboard);
        calculateDonut(resp.data.data);
        Setdonut(prev => ({
          ...prev,
          completed: resp.data.donut
        }));
      }
    } catch (e) {
      console.log(e);
    }
  };


  useEffect(() => {
    if (checkToken()) {
      const fetchAll = async () => {
        setLoading(true);
        await Promise.all([getCurriculum(), classifyUser()]);
        setLoading(false);
      };
      fetchAll();
    }else{
      nav("/login");
    }

  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "3rem" }}>
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="dashboard-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "3rem"}}>
        <h1 className="dashboard-title">Welcome, {name}!</h1>
        {classificationMsg && classificationMsg.length>0 && (
          <div className="classification-message">
            {classificationMsg}
          </div>
        )}
        {curr.length>0 ? <div className="curriculums">
          {curr
            .filter(item => {
              const now = new Date();
              const start = new Date(item.startdate);
              const end = new Date(start.getTime() + item.duration * 24 * 60 * 60 * 1000);
              return start <= now && now <= end;
            })
            .map((item, index) => (
              <div key={index} className="day-card">
                <h4 style={{ cursor: "pointer" }} onClick={() => nav(`/study-curriculum/${item.id}`)}>
                  Day {1 + Math.floor((new Date() - new Date(item.startdate)) / (1000 * 60 * 60 * 24))} of {item.topic}
                </h4>
              </div>
            ))}
        </div>:""}
        {donut.total>0 || bar.length>0 ?  <div className="dashboard-charts-row">
          {donut.total>0 ? <div className="dashboard-chart-card">
            <DonutChart completed={donut.completed > donut.total ? donut.total : donut.completed} total={donut.total} title={"Today Progress"} ct={"Completed"} rt={"Remaining"} />
          </div> : ""}
          {bar.length>0 ? 
          
          <div className="dashboard-chart-card">
            <BarChartComponent data={bar} title={"Last 7 Days Progress"} col={"date"} row={"count_of_completed"} rowname={"Completed"} />
          </div> : ""}
        </div>
      :""}
      
      </div>

      {users && users.length > 0 ? <div className="leaderboard-container">
        <h2 className="leaderboard-title">🏆 Leaderboard – Top 20 by XP</h2>
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> : ""}
      <AskAIChat />
    </div>
  );
};

export default Dashboard;