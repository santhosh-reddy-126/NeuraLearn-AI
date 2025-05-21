import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./Dashboard.css";
import { backend, python } from "../../../data";
import { toast } from "react-toastify";
import axios from "axios";
import { resolvePath, useNavigate } from "react-router-dom";
import BarChartComponent from "../../Components/Charts/BarChartComponent";
import AskAIChat from "../../Components/AskAIChat/AskAIChat";
import DonutChart from "../../Components/Charts/DonutChart";
import Loading from "../../Components/Loading/Loading"; // <-- import your loading component

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const name = user.name || "User";
  const nav = useNavigate();
  const [curr, allcurr] = useState([]);
  const [prog, setProg] = useState([]);
  const [bar, setbar] = useState({});
  const [donut, Setdonut] = useState({
    completed: 0,
    total: 0
  });
  const [classificationMsg, setClassificationMsg] = useState("");
  const [loading, setLoading] = useState(true); // <-- loading state

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  const classifyUser = async () => {
    try {
      const resp = await axios.post(python + "classify", {
        user_id: getUserId()
      });
      if (!resp.data.success) {
        toast.error("Unable to classify");
      } else {
        setClassificationMsg(resp.data.data || "No classification available.");
      }
    } catch (e) {
      console.error("Classification error:", e);
      setClassificationMsg("Unable to fetch classification.");
    }
  };

  // Calculate donut values for each curriculum item
  const calculateDonut = (item) => {
    const day = 1 + Math.floor((new Date() - new Date(item.startdate)) / (1000 * 60 * 60 * 24));
    Setdonut((prev) => ({
      ...prev,
      total: (item.curriculum[`Day ${day}`].Subtopics.length) * (day)
    }));
  };

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
        setbar(resp.data.bar);
        console.log(resp.data.bar);
        setProg(resp.data.prog);
        
        for (let i = 0; i < resp.data.data.length; i++) {
          calculateDonut(resp.data.data[i]);
        }
        Setdonut((prev) => ({
          ...prev,
          completed: resp.data.donut
        }));
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([getCurriculum(), classifyUser()]);
      setLoading(false);
    };
    fetchAll();
    // eslint-disable-next-line
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
      <div className="dashboard-main" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "3rem" }}>
        <h1 className="dashboard-title">Welcome, {name}!</h1>
        {classificationMsg && (
          <div className="classification-message">
            {classificationMsg}
          </div>
        )}
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
                <h4 style={{ cursor: "pointer" }} onClick={() => nav(`/study-curriculum/${item.id}`)}>
                  Day {1 + Math.floor((new Date() - new Date(item.startdate)) / (1000 * 60 * 60 * 24))} of {item.topic}
                </h4>
              </div>
            ))}
        </div>
        <div className="dashboard-charts-row">
          <div className="dashboard-chart-card">
            <DonutChart completed={donut.completed>donut.total ? donut.total:donut.completed} total={donut.total} title={"Total Progress"} ct={"Completed"} rt={"Remaining"} />
          </div>
          <div className="dashboard-chart-card">
            <BarChartComponent data={bar} title={"Last 7 Days Progress"} col={"date"} row={"count_of_completed"} rowname={"Completed"} />
          </div>
        </div>
      </div>
      <AskAIChat />
    </div>
  );
};

export default Dashboard;