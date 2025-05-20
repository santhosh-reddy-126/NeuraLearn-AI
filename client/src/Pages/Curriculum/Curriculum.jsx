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
    setLoadingDashboard(true); // Start dashboard loading
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
        setProg(resp.data.prog);
        setLoadingCurriculums(false); // Curriculum loaded

        // Now fetch dashboard data
        const temp = resp.data.data;
        const dashboardResults = {};
        await Promise.all(
          temp.map(async (item) => {
            const data = await fetchDashboardData(item.id);
            dashboardResults[item.id] = data;
          })
        );
        setDashboardData(dashboardResults);
        setLoadingDashboard(false); // Dashboard loaded
      }
    } catch (e) {
      console.log(e);
      setLoadingCurriculums(false);
      setLoadingDashboard(false);
    }
  }

  const checkNoOfTaskCompleted = (id) => {
    let count = 0;
    for (let i = 0; i < prog.length; i++) {
      if (prog[i].curr_id === id) {
        if (prog[i].completed === null) {
          count = count + 0;
          continue;
        }

        count = count + prog[i].completed.length;
      }
    }
    return count;
  }
  const addCurriculum = async (e) => {
    try {
      const picked = new Date(startdate);
      if (!startdate || isNaN(picked.getTime())) {
        toast.error("Please select a valid start date.");
        return;
      }
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
      const resp = await axios.post(backend + "api/curriculum/deletecurriculum", {
        id: id,
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
      const resp = await axios.post(python + "generate-curriculum", {
        goal,
        duration: duration.trim()
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

    try {
      const resp = await axios.post(python + "user-dashboard-data", {
        user_id,
        user_email,
        curr_id: curriculumId
      });
      if (resp.data.success) {
        return resp.data.data; // contains streak, todays_topics, todays_progress, last_quizzes
      } else {
        toast.error("Failed to fetch dashboard data");
        return null;
      }
    } catch (e) {
      toast.error("Error fetching dashboard data");
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
                      style={{
                        background: "#fff",
                        borderRadius: "1.2rem",
                        boxShadow: "0 2px 16px #3F8EFC11",
                        margin: "1.5rem 0",
                        padding: "1.5rem 2rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.7rem",
                        position: "relative"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                          <h3
                            style={{
                              cursor: "pointer",
                              margin: 0,
                              fontWeight: 700,
                              fontSize: "1.4rem",
                              color: "#11443c"
                            }}
                            onClick={() => navigate(`/study-curriculum/${item.id}`)}
                          >
                            {item.duration} days of {item.topic}
                          </h3>
                          {typeof item.streak === "number" && item.streak > 0 && (
                            <div className="curriculum-streak">
                              <span role="img" aria-label="fire" style={{ fontSize: 22, verticalAlign: "middle" }}>🔥</span>
                              <span style={{ marginLeft: 6, fontWeight: 600, color: "#e65100" }}>
                                Streak: {item.streak} day{item.streak > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="btns">
                          {status !== "Not Started" ? (
                            <img src={status === "In Progress" ? progress : com} alt="status" />
                          ) : ""}
                          <img src={del} onClick={() => deleteCurriculum(item.id)} alt="delete" />
                          <button
                            className="take-test-btn"
                            onClick={() => navigate(`/test/${item.id}/${0}`)}
                          >
                            📝 Take Test
                          </button>
                        </div>
                      </div>
                      {/* Downward arrow button */}
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <button
                          className="expand-dashboard-btn"
                          onClick={() => toggleExpand(item.id)}
                          aria-label={expanded[item.id] ? "Hide details" : "Show details"}
                        >
                          {expanded[item.id] ? "▲" : "▼"}
                        </button>
                      </div>
                      {/* Dashboard Data */}
                      {expanded[item.id] && (
                        loadingDashboard ? (
                          <div style={{ textAlign: "center", padding: "1rem" }}>
                            <Loading /> {/* or any spinner */}
                          </div>
                        ) : dashboardData[item.id] && (
                          <div className="dashboard-details-card">
                            <div style={{ fontWeight: 700, color: "#1976d2", marginBottom: "0.7rem" }}>Motivation</div>
                            <div style={{ marginBottom: "1rem" }}>{dashboardData[item.id].motivation}</div>
                            <div style={{ fontWeight: 700, color: "#1976d2", marginBottom: "0.7rem" }}>Tip</div>
                            <div style={{ marginBottom: "1rem" }}>{dashboardData[item.id].tip}</div>
                            <div style={{ fontWeight: 700, color: "#1976d2", marginBottom: "0.7rem" }}>Insight</div>
                            <div>{dashboardData[item.id].insight}</div>
                          </div>
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