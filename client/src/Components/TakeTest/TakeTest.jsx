// TakeTest.jsx
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Navbar/Navbar";
import BadgePopUp from "../Gamified/BadgePopUp";
import axios from "axios";
import "./TakeTest.css";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../Loading/Loading";

const TakeTest = () => {
     const { id, day } = useParams();
     const nav = useNavigate();
     const backend = import.meta.env.VITE_BACKEND_URL;
     const python = import.meta.env.VITE_PYTHON_URL;
     const [curr, setcurr] = useState([]);
     const [showBadge, setShowBadge] = useState(true);
     const [badge, setbadge] = useState(null);
     const [questions, setquestions] = useState([]);
     const [testDuration, setTestDuration] = useState(120);
     const [reviewMode, setReviewMode] = useState(false);

     const getData = async () => {
          try {
               const resp = await axios.post(backend + "api/curriculum/getcurriculumbyid", {
                    id: id
               });
               if (!resp.data.success) {
                    toast.success("Unable to get Curriculum!");
               } else {
                    setcurr(resp.data.data);
                    const temp_data = resp.data.data[0];
                    let my_topics = [];
                    let duration = 120;
                    const len = temp_data.curriculum[`Day ${day}`]?.Subtopics?.length || 1;
                    duration = 5 * len * 60;
                    my_topics = temp_data.curriculum[`Day ${day}`].Subtopics;
                    setTestDuration(duration);
                    generate_quiz(5 * len,my_topics, duration); // pass duration as argument
               }
          } catch (e) {
               console.log(e);
          }
     };

     const generate_quiz = async (total,topics, duration) => {
          try {
               const resp = await axios.post(python + "generate-quiz", {
                    total: total,
                    topics
               });
               if (!resp.data.success) {
                    toast.error(resp.data.message);
                    nav(`/study-curriculum/${id}`);
               } else {
                    toast.info(resp.data.message);
                    setquestions(resp.data.data.questions);
                    setTimeLeft(duration); 
               }
          } catch (e) {
               console.log(e);
          }
     };

     const [current, setCurrent] = useState(0);
     const [selected, setSelected] = useState({});
     const [showScore, setShowScore] = useState(false);
     const [timeLeft, setTimeLeft] = useState(120);
     const timerRef = useRef();

     // Audio refs
     const clickAudio = useRef(null);
     const timerAudio = useRef(null);
     const resultAudio = useRef(null);

     // Start timer audio when test starts, pause when test ends
     useEffect(() => {
          if (!showScore && timeLeft > 0 && timerAudio.current) {
               timerAudio.current.currentTime = 0;
               timerAudio.current.play();
          } else if ((showScore || timeLeft === 0) && timerAudio.current) {
               timerAudio.current.pause();
               timerAudio.current.currentTime = 0;
          }
     }, [showScore, timeLeft]);

     // Play timer audio when timer ends
     useEffect(() => {
          if (showScore && timeLeft === 0 && timerAudio.current) {
               timerAudio.current.play();
          }
     }, [showScore, timeLeft]);

     useEffect(() => {
          if (showScore && timeLeft > 0 && resultAudio.current) {
               resultAudio.current.play();
          }
     }, [showScore, timeLeft]);

     // Timer effect
     useEffect(() => {
          if (showScore) return;
          timerRef.current = setInterval(() => {
               setTimeLeft((prev) => {
                    if (prev <= 1) {
                         clearInterval(timerRef.current);
                         setShowScore(true);
                         onTestComplete();
                         return 0;
                    }
                    return prev - 1;
               });
          }, 1000);
          return () => clearInterval(timerRef.current);
     }, [showScore]);

     useEffect(() => {
          getData();
     }, []);

     // Play audio on option click
     const handleOptionChange = (e) => {
          const updatedQuestions = questions.map((q, idx) =>
               idx === current ? { ...q, selected: e.target.value } : q
          );
          setquestions(updatedQuestions);
          clickAudio.current && clickAudio.current.play();
     };

     const handleNext = () => {
          if (current < questions.length - 1) {
               setCurrent(current + 1);
          } else {
               setShowScore(true);
               clearInterval(timerRef.current);
               onTestComplete();
          }
     };

     const handlePrev = () => {
          if (current > 0) setCurrent(current - 1);
     };

     const handleRetake = () => {
          setCurrent(0);
          setSelected({});
          setShowScore(false);
          setTimeLeft(testDuration);
     };

     const score = questions.reduce(
          (acc, q) => acc + (q.selected === q.answer ? 1 : 0),
          0
     );

     const onTestComplete = async () => {
          try {
               let temp = localStorage.getItem("user");
               temp = JSON.parse(temp);
               const timeSpent = testDuration - timeLeft; // Calculate time spent in seconds
               const resp = await axios.post(backend + "api/test/updateresult", {
                    data: questions,
                    id: id,
                    user_id: temp.id,
                    time_spent: timeSpent
               });
               if (!resp.data.success) {
                    toast.error(resp.data.message);
               } else {
                    toast.info("+20XP Added!🎉");
                    setbadge(resp.data.myBadge);
                    if (resp.data.XP > 0) {
                         toast.info(`+${resp.data.XP} Extra XP Added for your Performance!🎉`);
                    }
                    if (resp.data.passed > 0) {
                         toast.info(`Wohoo! Level ${resp.data.passed + 1} Reached🎉`);
                    }
               }
          } catch (e) {
               console.log(e);
          }
     };

     if (!questions || questions.length === 0) {
          return (
               <div>
                    <Navbar />
                    <div className="take-test-container">
                         <Loading />
                    </div>
               </div>
          );
     }

     return (
          <div>
               <Navbar />
               {/* Audio elements */}
               <audio ref={clickAudio} src="/audio/click.mp3" preload="auto" />
               <audio ref={timerAudio} src="/audio/timer.mp3" preload="auto" loop />
               <audio ref={resultAudio} src="/audio/result.mp3" preload="auto" />
               <div className="take-test-container">
                    <div className="test-header">
                         <div className="test-progress">
                              <div className="test-progress-label">
                                   Question <b>{current + 1}</b> / {questions.length}
                              </div>
                              <div className="test-progress-bar-outer">
                                   <div
                                        className="test-progress-bar-inner"
                                        style={{
                                             width: `${((current + 1) / questions.length) * 100}%`
                                        }}
                                   ></div>
                              </div>
                         </div>
                         <div className={`test-timer ${timeLeft <= 15 ? "test-timer-warning" : ""}`}>
                              ⏰ {formatTime(timeLeft)}
                         </div>
                    </div>
                    {!showScore ? (
                         <>
                              <div className="test-question">
                                   <h3>
                                        Q{current + 1}. {questions[current].question}
                                   </h3>
                                   <div className="test-options">
                                        {questions[current].options.map((opt, idx) => (
                                             <label
                                                  key={idx}
                                                  className={`test-option${selected[current] === opt ? " selected" : ""}`}
                                             >
                                                  <input
                                                       type="radio"
                                                       name={`q${current}`}
                                                       value={opt}
                                                       checked={questions[current].selected === opt}
                                                       onChange={handleOptionChange}
                                                  />
                                                  {opt}
                                             </label>
                                        ))}
                                   </div>
                              </div>
                              <div className="test-controls">
                                   <button
                                        onClick={handlePrev}
                                        disabled={current === 0}
                                        className="test-btn"
                                   >
                                        Previous
                                   </button>
                                   <button
                                        onClick={handleNext}
                                        className="test-btn"
                                        disabled={!questions[current].selected}
                                   >
                                        {current === questions.length - 1 ? "Finish" : "Next"}
                                   </button>
                              </div>
                         </>
                    ) : (
                         <>
                              {!reviewMode ? (
                                   <div className="test-score">
                                        <h2>
                                             Your Score: <span style={{ color: "#3EE4B2" }}>{score}</span> / {questions.length}
                                        </h2>
                                        <p style={{ fontSize: "1.1rem", color: "#3F8EFC", margin: "1rem 0" }}>
                                             {score === questions.length
                                                  ? "Excellent! 🎉"
                                                  : score > 0
                                                       ? "Good try! Review and try again."
                                                       : "Don't worry, keep practicing!"}
                                        </p>
                                        <button className="test-btn" onClick={handleRetake}>
                                             Retake Test
                                        </button>
                                        <button className="test-btn" onClick={() => setReviewMode(true)}>
                                             Review Answers
                                        </button>
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
                                   </div>
                              ) : (
                                   <div className="test-review">
                                        <h2>Exam Review</h2>
                                        <ol>
                                             {questions.map((q, idx) => (
                                                  <li key={idx} style={{ marginBottom: "1.2rem" }}>
                                                       <div style={{ fontWeight: 600 }}>{q.question}</div>
                                                       <div>
                                                            <span style={{ color: "#3F8EFC" }}>Your answer:</span>{" "}
                                                            <span style={{
                                                                 color: q.selected === q.answer ? "#3EE4B2" : "#ff3b3b",
                                                                 fontWeight: 600
                                                            }}>
                                                                 {q.selected || <em>Not answered</em>}
                                                            </span>
                                                       </div>
                                                       <div>
                                                            <span style={{ color: "#3F8EFC" }}>Correct answer:</span>{" "}
                                                            <span style={{ color: "#3EE4B2", fontWeight: 600 }}>{q.answer}</span>
                                                       </div>
                                                  </li>
                                             ))}
                                        </ol>
                                        <button className="test-btn" onClick={() => setReviewMode(false)}>
                                             Back to Result
                                        </button>
                                   </div>
                              )}
                         </>
                    )}
               </div>
          </div>
     );
};

// Helper to format time
function formatTime(secs) {
     const m = String(Math.floor(secs / 60)).padStart(2, "0");
     const s = String(secs % 60).padStart(2, "0");
     return `${m}:${s}`;
}

export default TakeTest;