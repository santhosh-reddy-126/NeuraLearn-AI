import React, { useEffect, useState } from "react";
import "./Curriculum.css";
import { backend, python } from "../../../data";
import { toast } from "react-toastify";
import Loading from "../../Components/Loading/Loading";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import progress from "../../assets/progress.png"
import del from "../../assets/delete.png"
import com from "../../assets/completed.png"
import cert from "../../assets/certificate.png"

const Curriculum = () => {
  const [goal, setGoal] = useState("");
  const navigate = useNavigate();
  const [duration, setDuration] = useState("");
  const [curriculum, setCurriculum] = useState(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [startdate, setStartDate] = useState("");
  const [curr, allcurr] = useState([]);
  const [prog, setProg] = useState([]);
  const [loadingCurriculums, setLoadingCurriculums] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCurriculum = async (e) => {
    setLoadingCurriculums(true);
    setLoadingDashboard(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user.email;
      const user_id = user.id;
      const token = localStorage.getItem("token");

      const resp = await axios.post(backend + "api/curriculum/getcurriculum", {
        email: email,
        userId: user_id
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (!resp.data.success) {
        toast.success("Unable to get Curriculum!")
      } else {
        allcurr(resp.data.data);
        setProg(resp.data.prog);
        setLoadingCurriculums(false); 
        const temp = resp.data.data;
        const dashboardResults = {};
        await Promise.all(
          temp.map(async (item) => {
            const data = await fetchDashboardData(item.id);
            dashboardResults[item.id] = data;
          })
        );
        setDashboardData(dashboardResults);
        setLoadingDashboard(false);
      }
    } catch (e) {
      console.log(e);
      setLoadingCurriculums(false);
      setLoadingDashboard(false);
    }
  }

  const addCurriculum = async (e) => {
    try {
      const picked = new Date(startdate);
      if (!startdate || isNaN(picked.getTime())) {
        toast.error("Please select a valid start date.");
        return;
      }
      const token = localStorage.getItem("token");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      picked.setHours(0, 0, 0, 0);

      if (picked < today) {
        toast.error("Start date cannot be in the past.");
        return;
      }
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const email = user.email;
      let count = 0;
      for (let j = 1; j <= duration; j++) {
        count += curriculum[`Day ${j}`]['Subtopics'].length;
      }
      const resp = await axios.post(backend + "api/curriculum/addcurriculum", {
        goal: goal,
        duration: duration,
        curriculum: curriculum,
        startdate: startdate,
        email: email,
        count: count
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (resp.data.success) {
        toast.success("Curriculum Added!")
      }
    } catch (e) {
      console.log(e);
    }
  };
  const deleteCurriculum = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.post(backend + "api/curriculum/deletecurriculum", {
        id: id,
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (resp.data.success) {
        toast.success("Curriculum deleted!");
        getCurriculum();
      } else {
        toast.error("Failed to delete curriculum.");
      }
    } catch (e) {
      console.log(e);
      toast.error("Error deleting curriculum.");
    }
  };

  const handleCurriculum = async (e) => {
    e.preventDefault();
    if (!goal.trim() || !duration.trim()) return;
    setLoadingCurriculum(true);
    setCurriculum(null);
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.post(python + "generate-curriculum", {
        goal,
        duration: duration.trim()
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (resp.data.success) {
        setCurriculum(resp.data.data);
      } else {
        toast.error(resp.data.message);
      }
    } catch (err) {
      console.log(err)
      toast.error("Error fetching curriculum.");
    }
    setLoadingCurriculum(false);
  };

  const fetchDashboardData = async (curriculumId) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const user_id = user.id;
    const user_email = user.email;
    const token = localStorage.getItem("token");
    try {
      const resp = await axios.post(python + "user-dashboard-data", {
        user_id,
        user_email,
        curr_id: curriculumId
      },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      if (resp.data.success) {
        console.log(resp.data)
        return resp.data.data; 
      } else {
        return {};
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  useEffect(() => {
    getCurriculum();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="curriculum-main">
        <div className="curriculum-section">
          <form className="curriculum-form" onSubmit={handleCurriculum}>
            <input
              className="curriculum-input"
              type="text"
              placeholder="Your learning goal (e.g. Python basics)"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <input
              className="curriculum-input"
              type="number"
              min="1"
              placeholder="Duration (days)[Maximum 14 days]"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
            {!loadingCurriculum ? (
              <button className="curriculum-btn" type="submit" disabled={loadingCurriculum}>
                Get Curriculum
              </button>
            ) : (
              <Loading />
            )}
          </form>
          {curriculum && (
            <div className="curriculum-result">
              <h3>Day-wise Curriculum</h3>
              <ul>
                {Object.entries(curriculum)
                  .sort(([a], [b]) => {
                    const numA = parseInt(a.match(/\d+/)?.[0]);
                    const numB = parseInt(b.match(/\d+/)?.[0]);
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    return a.localeCompare(b);
                  })
                  .map(([day, info]) => (
                    <li key={day}>
                      <strong>{day}:</strong> {info.Topic}
                      <p>{info.Description}</p>
                      {info.Subtopics && (
                        <ul>
                          {info.Subtopics.map((sub, idx) => (
                            <li key={idx}>{sub}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
              </ul>
              <div className="curriculum-actions">
                <label className="curriculum-date-label">
                  <span className="curriculum-date-title">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" style={{ marginRight: "0.5rem", verticalAlign: "middle" }}>
                      <rect x="3" y="5" width="18" height="16" rx="3" fill="#3F8EFC" opacity="0.12" />
                      <rect x="3" y="5" width="18" height="16" rx="3" stroke="#3F8EFC" strokeWidth="1.5" />
                      <rect x="7" y="2" width="2" height="4" rx="1" fill="#3F8EFC" />
                      <rect x="15" y="2" width="2" height="4" rx="1" fill="#3F8EFC" />
                    </svg>
                    Start Date:
                  </span>
                  <input
                    className="curriculum-date"
                    type="date"
                    value={startdate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <button className="curriculum-add-btn" onClick={addCurriculum}>Add Curriculum</button>
              </div>
            </div>
          )}
        </div>
        <div className="my-curriculums">
          {loadingCurriculums ? (
            <Loading />
          ) : (
            <>
              {curr.length > 0 ? <h1>My Curriculums</h1> : ""}
              {
                curr.map((item) => {
                  const today = new Date();
                  const startDate = new Date(item.startdate);
                  const endDate = new Date(startDate);
                  endDate.setDate(startDate.getDate() + parseInt(item.duration));

                  let status = "Not Started";
                  if (today >= startDate && today <= endDate) status = "In Progress";
                  else if (today > endDate) status = "Completed";

                  const progressPercent = status === "In Progress"
                    ? Math.min(100, Math.max(0, ((today - startDate) / (endDate - startDate)) * 100))
                    : 0;

                  return (
                    <div
                      className={`curr-item ${status.toLowerCase().replace(" ", "-")}`}
                      key={item.id}
                    >
                      <div className="curr-item-header">
                        <div className="curr-item-main">
                          <h3 onClick={() => navigate(`/study-curriculum/${item.id}`)}>
                            {item.duration} days of {item.topic}
                          </h3>

                          {typeof item.streak === "number" && item.streak > 0 && (
                            <div className="curriculum-streak">
                              <span role="img" aria-label="fire">🔥</span>
                              <span>Streak: {item.streak} day{item.streak > 1 ? "s" : ""}</span>
                            </div>
                          )}
                        </div>

                        <div className="btns">
                          {item.completed_count === item.count && item.quiz_count>0 && (
                            <img
                              src={cert}
                              onClick={() => navigate(`/report/${item.id}`)}
                              width={42}
                              height={42}
                              alt="Certificate"
                              title="View Certificate"
                              className="btn-icon"
                            />
                          )}

                          {status !== "Not Started" && (
                            <img
                              src={status === "In Progress" ? progress : com}
                              alt={status}
                              className="btn-icon"
                            />
                          )}

                          <img
                            src={del}
                            onClick={() => deleteCurriculum(item.id)}
                            alt="Delete"
                            title="Delete Curriculum"
                            className="btn-icon"
                          />
                        </div>
                      </div>

                      <div className="expand-section">
                        <button
                          className="expand-dashboard-btn"
                          onClick={() => toggleExpand(item.id)}
                          aria-label={expanded[item.id] ? "Hide details" : "Show details"}
                        >
                          {expanded[item.id] ? "▲" : "▼"}
                        </button>
                      </div>

                      {expanded[item.id] && (
                        loadingDashboard ? (
                          <div className="loading-center"><Loading /></div>
                        ) : (
                          dashboardData[item.id] && Object.keys(dashboardData[item.id]).length>0 && (
                            <div className="dashboard-details-card">
                              <h4>Motivation</h4>
                              <p>{dashboardData[item.id].motivation}</p>
                              <h4>Tip</h4>
                              <p>{dashboardData[item.id].tip}</p>
                              <h4>Insight</h4>
                              <p>{dashboardData[item.id].insight}</p>
                            </div>
                          )
                        )
                      )}
                    </div>

                  );
                })
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Curriculum;