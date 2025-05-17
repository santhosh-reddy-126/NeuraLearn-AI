import React, { useEffect, useState } from "react";
import "./Curriculum.css";
import { backend, python } from "../../../data";
import { toast } from "react-toastify";
import Loading from "../../Components/Loading/Loading";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import prog from "../../assets/progress.png"
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
        console.log(resp.data.data);
      }
    } catch (e) {
      console.log(e);
    }
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

      const resp = await axios.post(backend + "api/curriculum/addcurriculum", {
        goal: goal,
        duration: duration,
        curriculum: curriculum,
        startdate: startdate,
        email: email
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
          {curr.length>0 ? <h1>My Curriculums</h1>:""}
          {
            curr.map((item) => {
              const today = new Date();
              const startDate = new Date(item.startdate);
              const endDate = new Date(startDate);
              endDate.setDate(startDate.getDate() + parseInt(item.duration));

              let status = "Not Started";
              if (today >= startDate && today <= endDate) status = "In Progress";
              else if (today > endDate) status = "Completed";

              return (
                <div className={`curr-item ${status.toLowerCase().replace(" ", "-")}`} key={item.id} onClick={()=>navigate(`/study-curriculum/${item.id}`)}>
                  
                  <h3>{item.duration} days of {item.topic}</h3>
                  <div className="btns">
                        {status!="Not Started" ? <img src={status=="In Progress" ? prog:com} />:""}
                        <img src={del} onClick={()=>deleteCurriculum(item.id)} />
                  </div>
                  
                </div>
              );
            })
          }
        </div>
      </div>

    </div>
  );
};

export default Curriculum;