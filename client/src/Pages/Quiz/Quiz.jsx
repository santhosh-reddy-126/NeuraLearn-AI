import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar";
import axios from "axios";
import { backend } from "../../../data";
import DonutChart from "../../Components/Charts/DonutChart";
import BarChartComponent from "../../Components/Charts/BarChartComponent";
import Loading from "../../Components/Loading/Loading";
import LineChartComponent from "../../Components/Charts/LineChartComponent";
import "./Quiz.css";

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [hist, sethist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openQuizIndex, setOpenQuizIndex] = useState(null);
  function convertObjectToArray(obj) {
    return Object.entries(obj).map(([key, value]) => ({
      topic: key,
      mistakes: value
    }));
  }

  const convertScoresToChartData = (scores) => {
    return scores.map((score, index) => ({
      attempt: `Attempt ${index + 1}`,
      score
    }));
  };



  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const resp = await axios.post(backend + "api/test/getuserquizzes", {
          user_id: user.id,
        });
        if (resp.data.success) {
          setQuizzes(resp.data.data);
          console.log(resp.data)
          sethist(resp.data.analytics);
        }
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    };
    fetchQuizzes();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="quiz-container">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="quiz-container">
        <h2>All Quizzes Taken</h2>
        {quizzes.length === 0 ? (
          <p>No quizzes taken yet.</p>
        ) : (
          <table className="quiz-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Curriculum</th>
                <th>Score</th>
                <th>Time Spent (s)</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {quizzes.map((quiz, idx) => (
                <React.Fragment key={quiz.id}>
                  <tr
                    className={`quiz-row${openQuizIndex === idx ? " selected" : ""}`}
                    onClick={() => setOpenQuizIndex(openQuizIndex === idx ? null : idx)}
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <span className="quiz-expand-icon">
                        {openQuizIndex === idx ? "▶" : "▶"}
                      </span>
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </td>
                    <td>{quiz.curriculum.topic}</td>
                    <td>{(quiz.score * 100).toFixed(1)}%</td>
                    <td>{quiz.timeSpent}</td>
                    <td>
                      {quiz.topics && quiz.topics.length > 0
                        ? quiz.topics.join(", ")
                        : "None"}
                    </td>
                  </tr>
                  {openQuizIndex === idx && (
                    <tr>
                      <td colSpan={5} style={{ background: "#fafdff", padding: 0 }}>
                        <div className="quiz-analytics-dropdown" style={{
                          display: "flex",
                          gap: "2rem",
                          padding: "2rem",
                          borderRadius: "1rem",
                          boxShadow: "0 4px 24px #3F8EFC22",
                          margin: "1rem 0"
                        }}>
                          <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                            <div>
                              <h4 className="analytics-title">Quiz Analytics</h4>
                              <div className="analytics-details">
                                <div><b className="analytics-label">Date:</b> <span className="analytics-value analytics-date">{new Date(quiz.created_at).toLocaleString()}</span></div>
                                <div><b className="analytics-label">Curriculum:</b> <span className="analytics-value analytics-curriculum">{quiz.curriculum.topic}</span></div>
                                <div><b className="analytics-label">Total Questions:</b> <span className="analytics-value analytics-total">{quiz.total}</span></div>
                                <div><b className="analytics-label">Correct Answers:</b> <span className="analytics-value analytics-correct">{quiz.correct}</span></div>
                                <div><b className="analytics-label">Score:</b> <span className="analytics-value analytics-score">{(quiz.score * 100).toFixed(1)}%</span></div>
                                <div><b className="analytics-label">Time Spent:</b> <span className="analytics-value analytics-time">{quiz.timeSpent} seconds</span></div>
                                <div><b className="analytics-label">Topics:</b> <span className="analytics-value analytics-review">{quiz.topics && quiz.topics.length > 0 ? quiz.topics.join(", ") : "None"}</span></div>
                                <div style={{ marginTop: 10 }}>
                                  <b className="analytics-label">Review Breakdown:</b>
                                  <ul className="analytics-breakdown-list">
                                    {quiz.review && Object.entries(quiz.review).map(([topic, count]) => (
                                      <li key={topic}><span className="analytics-topic">{topic}</span>: <span className="analytics-mistakes">{count} incorrect</span></li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <div className="weak-topics-card">
                              <h5>Top 3 Weak Topics</h5>
                              <ul className="weak-topics-list">
                                {quiz.review &&
                                  Object.entries(quiz.review)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3)
                                    .map(([topic, count]) => (
                                      <li key={topic}>{topic} <span style={{ color: "#d32f2f", fontWeight: 400 }}>({count} mistakes)</span></li>
                                    ))
                                }
                                {(!quiz.review || Object.keys(quiz.review).length === 0) && (
                                  <li style={{ color: "#888", fontWeight: 400 }}>No weak topics 🎉</li>
                                )}
                              </ul>
                            </div>
                            <div className="motivational-badge">
                              {quiz.score >= 0.8 ? (
                                <>
                                  <span role="img" aria-label="star" style={{ fontSize: 32 }}>🏅</span>
                                  <div style={{ color: "#388e3c", fontWeight: 700, fontSize: "1.1rem", marginTop: 8 }}>
                                    Quiz Master!
                                  </div>
                                  <div style={{ color: "#388e3c", fontSize: "0.98rem" }}>
                                    Outstanding performance! Keep up the great work.
                                  </div>
                                </>
                              ) : quiz.score >= 0.5 ? (
                                <>
                                  <span role="img" aria-label="rocket" style={{ fontSize: 32 }}>🚀</span>
                                  <div style={{ color: "#1976d2", fontWeight: 700, fontSize: "1.1rem", marginTop: 8 }}>
                                    Keep Improving!
                                  </div>
                                  <div style={{ color: "#1976d2", fontSize: "0.98rem" }}>
                                    Good effort! Review your weak topics and aim higher next time.
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span role="img" aria-label="seedling" style={{ fontSize: 32 }}>🌱</span>
                                  <div style={{ color: "#d32f2f", fontWeight: 700, fontSize: "1.1rem", marginTop: 8 }}>
                                    Don't Give Up!
                                  </div>
                                  <div style={{ color: "#d32f2f", fontSize: "0.98rem" }}>
                                    Every mistake is a step towards mastery. Try again!
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                            <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 2px 12px #3F8EFC11", padding: "1.2rem" }}>
                              <DonutChart completed={quiz.correct} total={quiz.total} title={"Quiz Summary"} ct={"Correct"} rt={"Wrong"} />
                            </div>
                            <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 2px 12px #3F8EFC11", padding: "1.2rem" }}>
                              <BarChartComponent data={convertObjectToArray(quiz.review)} title={"Topic wise Summary"} col={"topic"} row={"mistakes"} rowname={"Wrong Answers"} />
                            </div>
                            <div style={{ background: "#fff", borderRadius: "1rem", boxShadow: "0 2px 12px #3F8EFC11", padding: "1.2rem" }}>
                              <LineChartComponent
                                data={convertScoresToChartData(hist.find(item => item.curr_id === quiz.curr_id)?.score_array || [])}
                                xKey="attempt"
                                yKey="score"
                                title="Your Score Progress"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Quiz;