// TakeTest.jsx
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../Navbar/Navbar";
import axios from "axios";
import { backend, python } from "../../../data";
import "./TakeTest.css";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../Loading/Loading"; // Make sure this import exists and points to your loading component

const TakeTest = () => {
     const { id, day } = useParams();
     const [curr, setcurr] = useState([]);
     const [questions, setquestions] = useState([]);
     const [testDuration, setTestDuration] = useState(120);
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
                    let duration = 120; // default fallback

                    if (day > 0) {
                         const len = temp_data.curriculum[`Day ${day}`]?.Subtopics?.length || 1;
                         duration = 5 * len * 60;
                         my_topics = temp_data.curriculum[`Day ${day}`].Subtopics;
                    } else {
                         duration = 2 * (temp_data.count || 1) * 60;
                         for (let i = 1; i <= Number(temp_data.duration); i++) {
                              my_topics = [...my_topics, ...temp_data.curriculum[`Day ${i}`].Subtopics];
                         }
                    }
                    setTestDuration(duration);
                    generate_quiz(my_topics, duration); // pass duration as argument
               }
          } catch (e) {
               console.log(e);
          }
     };

     const generate_quiz = async (topics, duration) => {
          try {
               const resp = await axios.post(python + "generate-quiz", {
                    total: day > 0 ? 15 : 60,
                    topics
               });
               if (!resp.data.success) {
                    toast.success("Unable to create Quiz!");
               } else {
                    setquestions(resp.data.data.questions);
                    setTimeLeft(duration); // use the duration passed as argument
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
          setSelected({ ...selected, [current]: e.target.value });
          clickAudio.current && clickAudio.current.play();
     };

     const handleNext = () => {
          if (current < questions.length - 1) {
               setCurrent(current + 1);
          } else {
               setShowScore(true);
               clearInterval(timerRef.current);
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
          (acc, q, idx) => acc + (selected[idx] === q.answer ? 1 : 0),
          0
     );

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
                                                       checked={selected[current] === opt}
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
                                        disabled={selected[current] == null}
                                   >
                                        {current === questions.length - 1 ? "Finish" : "Next"}
                                   </button>
                              </div>
                         </>
                    ) : (
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
                         </div>
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