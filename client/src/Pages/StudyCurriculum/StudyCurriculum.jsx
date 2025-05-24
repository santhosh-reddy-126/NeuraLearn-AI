import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./StudyCurriculum.css";
import { backend, python } from "../../../data.jsx";
import BadgePopUp from "../../Components/Gamified/BadgePopUp.jsx"
import left from "../../assets/left.png";
import right from "../../assets/right.png";
import tcomp from "../../assets/taskcomp.png";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Loading from '../../Components/Loading/Loading.jsx';
import AskAIChat from "../../Components/AskAIChat/AskAIChat.jsx";
import { toast } from "react-toastify";

const StudyCurriculum = () => {
  const [data, setData] = useState({});
  const [prog, setProg] = useState({});
  const { id } = useParams();
  const nav = useNavigate();
  const [showBadge, setShowBadge] = useState(true);
  const [badge, setbadge] = useState(null);
  const [day, setDay] = useState(1);
  const [openTopic, setOpenTopic] = useState(null);
  const [topicContents, setTopicContents] = useState({});
  const [topicStartTimes, setTopicStartTimes] = useState({});


  // Mark topic as complete
  const markComplete = async (topic, idx) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const user_id = user ? user.id : 0;
      const curr_id = data ? data.id : 0;
      const user_email = user ? user.email : "none@gmail.com";

      // Calculate time taken
      const key = `${day}-${idx}`;
      const startTime = topicStartTimes[key] || Date.now();
      const timeTakenSec = Math.round((Date.now() - startTime) / 1000);

      const resp = await axios.post(backend + "api/curriculum/marktopiccompleted", {
        user_id,
        user_email,
        curr_id,
        topic,
        time_taken: timeTakenSec // <-- send time taken in seconds
      });
      if (resp.data.success) {
        setbadge(resp.data.myBadge);
        console.log(resp.data);
        setOpenTopic(null);
        getData();
        toast.success(`${topic} Marked as Completed`);
        toast.info(`+${resp.data.XP}XP Added!🎉`);
        if (resp.data.StreakXP > 0) {
          toast.info(`+${resp.data.StreakXP}XP Extra Added🎉`);
        }
        if (resp.data.passed > 0) {
          toast.info(`Wohoo! Level ${resp.data.passed + 1} Reached🎉`);
        }
      } else {
        toast.error(resp.data.message);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Fetch curriculum data
  const getData = async () => {
    try {
      const resp = await axios.post(backend + "api/curriculum/getcurriculumbyid", { id });
      if (resp.data.success) {
        setData(resp.data.data[0]);
        setProg(resp.data.prog);
        console.log(resp.data.prog);
        const diff = Math.floor((new Date() - new Date(resp.data.data[0].startdate)) / (1000 * 60 * 60 * 24));
        if (diff >= 0) setDay(1 + diff);
        console.log(new Date());
      }
    } catch (e) {
      console.log(e);
    }
  };

  const checkTaskCompleted = (topic) => {
    for (let i = 0; i < prog.length; i++) {
      if (prog[i].completed && (topic in prog[i].completed)) {
        return true;
      }
    }
    return false;
  }


  const changeDay = (direction) => {
    if (direction === "left" && day > 1) {
      setDay((prev) => prev - 1);
      setOpenTopic(null);
    }
    if (direction === "right" && day < data.duration) {
      setDay((prev) => prev + 1);
      setOpenTopic(null);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line
  }, []);

  // Topic dropdown handler
  const handleTopicClick = async (idx, topic) => {
    if (openTopic === idx) {
      setOpenTopic(null);
      return;
    }
    setOpenTopic(idx);

    // Set start time for this topic
    setTopicStartTimes(prev => ({
      ...prev,
      [`${day}-${idx}`]: Date.now()
    }));

    if (!topicContents[`${day}-${idx}`]) {
      let val = "";
      try {
        const resp = await axios.post(python + "explain-topic", { topic });
        if (resp.data.success) {
          val = resp.data.answer;
          console.log(val);
        }
      } catch (e) {
        console.log(e);
      }
      setTopicContents((prev) => ({
        ...prev,
        [`${day}-${idx}`]: val,
      }));
    }
  };


  return (
    <div>
      <Navbar />
      <div className="study-curriculum-container">
        <div className="day-nav-row">
          <button className="triangle-btn" onClick={() => changeDay("left")}>
            <img src={left} alt="Previous Day" width={40} height={40} />
          </button>
          <span className="day-label">Day {day}</span>
          <button className="triangle-btn" onClick={() => changeDay("right")}>
            <img src={right} alt="Next Day" width={40} height={40} />
          </button>
        </div>
        
        <div className="topics-list">
          {Object.keys(data).length > 0 &&
            data.curriculum?.[`Day ${day}`]?.Subtopics?.map((topic, idx) => (
              <div className="topic-card" key={idx}>
                <div
                  className="topic-title-row"
                  onClick={() => handleTopicClick(idx, topic)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  <span>{topic}</span>
                  {checkTaskCompleted(topic) && (
                    <img
                      src={tcomp}
                      alt="Completed"
                      className="topic-complete-icon"
                      style={{
                        width: 22,
                        height: 22,
                        marginLeft: 4,
                        verticalAlign: "middle"
                      }}
                    />
                  )}
                </div>
                {openTopic === idx && (
                  <div className="topic-dropdown">
                    <div className="topic-content-area">
                      {topicContents[`${day}-${idx}`] ? (
                        <div>
                          <header className="topic-header">
                            <span role="img" aria-label="topic" style={{ fontSize: "1.5rem" }}>📚</span>
                            <h2 className="topic-title">{topic}</h2>
                          </header>

                          <section className="topic-section">
                            <h4><span role="img" aria-label="info">💡</span> What is it?</h4>
                            <div className="topic-section-content">
                              {topicContents[`${day}-${idx}`]["def"]}
                            </div>
                          </section>

                          <section className="topic-section">
                            <h4><span role="img" aria-label="importance">🎯</span> Why is it important?</h4>
                            <div className="topic-section-content">
                              {topicContents[`${day}-${idx}`]["imp"]}
                            </div>
                          </section>

                          <section className="topic-section">
                            <h4><span role="img" aria-label="key">🔑</span> Key Concepts</h4>
                            <ul>
                              {topicContents[`${day}-${idx}`]["comp"]?.map((item, key) => (
                                <li key={key}>{item}</li>
                              ))}
                            </ul>
                          </section>

                          <section className="topic-section">
                            <h4><span role="img" aria-label="how">⚙️</span> How does it work?</h4>
                            <ol>
                              {topicContents[`${day}-${idx}`]["steps"]?.map((item, key) => (
                                <li key={key}>
                                  <strong>{item.title}:</strong> {item.content}
                                </li>
                              ))}
                            </ol>
                          </section>

                          <section className="topic-section">
                            <h4><span role="img" aria-label="example">📝</span> Example / Application</h4>
                            <div className="topic-section-content">
                              {topicContents[`${day}-${idx}`]["ex"]}
                            </div>
                          </section>

                          {topicContents[`${day}-${idx}`]["form"]?.length > 0 && (
                            <section className="topic-section">
                              <h4><span role="img" aria-label="formula">📐</span> Formulas / Syntax / Diagrams</h4>
                              <div className="topic-section-content">
                                {topicContents[`${day}-${idx}`]["form"].map((item, key) => (
                                  <div key={key} style={{ marginBottom: 8 }}>
                                    <span dangerouslySetInnerHTML={{ __html: item.content }} />
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}

                          <section className="topic-section">
                            <h4><span role="img" aria-label="mistake">❗</span> Common Mistakes</h4>
                            <ul>
                              {topicContents[`${day}-${idx}`]["mistakes"]?.map((item, key) => (
                                <li key={key}>{item}</li>
                              ))}
                            </ul>
                          </section>

                          <section className="topic-section">
                            <h4><span role="img" aria-label="summary">📝</span> Summary</h4>
                            <div className="topic-section-content">
                              {topicContents[`${day}-${idx}`]["summary"]}
                            </div>
                          </section>

                          {/* Resource Section */}
                          {(topicContents[`${day}-${idx}`]["youtube"] || topicContents[`${day}-${idx}`]["article"]) && (
                            <section className="topic-section resource-section">
                              <h4>
                                <span role="img" aria-label="resources">🔗</span> Further Learning
                              </h4>
                              <div className="resource-links">
                                {topicContents[`${day}-${idx}`]["youtube"] && (
                                  <a
                                    className="resource-link youtube-link"
                                    href={topicContents[`${day}-${idx}`]["youtube"].url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img src="https://img.icons8.com/color/48/000000/youtube-play.png" alt="YouTube" />
                                    <span>{topicContents[`${day}-${idx}`]["youtube"].title}</span>
                                  </a>
                                )}
                                {topicContents[`${day}-${idx}`]["article"] && (
                                  <a
                                    className="resource-link article-link"
                                    href={topicContents[`${day}-${idx}`]["article"].url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img src="https://img.icons8.com/color/48/000000/read.png" alt="Article" />
                                    <span>{topicContents[`${day}-${idx}`]["article"].title}</span>
                                  </a>
                                )}
                              </div>
                            </section>
                          )}

                          {!checkTaskCompleted(topic) && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                              <label className="mark-complete-checkbox">
                                <input
                                  type="checkbox"
                                  onChange={() => markComplete(topic, idx)}
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-label">Mark as Complete</span>
                              </label>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Loading />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          }
          {/* Take Test Button after all topics */}
          <div className="take-test-btn-container">
            <button
              className="take-test-btn"
              onClick={() => nav(`/test/${data.id}/${day}`)}
            >
              <span role="img" aria-label="test" style={{ marginRight: 8 }}>📝</span>
              Take Test
            </button>
          </div>
        </div>
      </div>
      {showBadge && badge!=null ?  
      <div id="modalOverlay" className="hidden">
        <div id="popup">
          <BadgePopUp
          show={showBadge}
          badge={badge}
          onClose={() => setShowBadge(false)}
        />
        </div>
      </div>: ""}
      <AskAIChat />
    </div>
  );
};

export default StudyCurriculum;