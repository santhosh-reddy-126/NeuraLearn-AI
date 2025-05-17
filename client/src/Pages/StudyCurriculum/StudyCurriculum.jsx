import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import "./StudyCurriculum.css";
import { backend, python } from "../../../data.jsx";
import left from "../../assets/left.png";
import right from "../../assets/right.png";
import tcomp from "../../assets/taskcomp.png";
import { useParams } from "react-router-dom";
import axios from "axios";
import Loading from '../../Components/Loading/Loading.jsx';
import AskAIChat from "../../Components/AskAIChat/AskAIChat.jsx";
import { toast } from "react-toastify";

const StudyCurriculum = () => {
  const [data, setData] = useState({});
  const { id } = useParams();
  const [day, setDay] = useState(1);
  const [openTopic, setOpenTopic] = useState(null);
  const [topicContents, setTopicContents] = useState({});

  // Mark topic as complete
  const markComplete = async (topic) => {
    try {
      const resp = await axios.post(backend + "api/curriculum/marktopiccompleted", {
        topic,
        id
      });
      if (resp.data.success) {
        toast.success(`${topic} Marked as Completed`);
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
        const diff = Math.floor((new Date() - new Date(resp.data.data[0].startdate)) / (1000 * 60 * 60 * 24));
        if (diff >= 0) setDay(1 + diff);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Change day handler
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
    if (!topicContents[`${day}-${idx}`]) {
      let val = "";
      try {
        const resp = await axios.post(python + "explain-topic", { topic });
        if (resp.data.success) val = resp.data.answer;
      } catch (e) {
        console.log(e);
      }
      setTopicContents((prev) => ({
        ...prev,
        [`${day}-${idx}`]: val,
      }));
    }
  };

  // Helper to check if topic is completed
  const isTopicCompleted = (topic) =>
    data.completion?.some((t) => t === topic);

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
                  {isTopicCompleted(topic) && (
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

                          {!isTopicCompleted(topic) && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                              <button
                                className="mark-complete-btn"
                                onClick={() => markComplete(topic)}
                              >
                                ✅ Mark as Complete
                              </button>
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
            ))}
        </div>
      </div>
      <AskAIChat />
    </div>
  );
};

export default StudyCurriculum;