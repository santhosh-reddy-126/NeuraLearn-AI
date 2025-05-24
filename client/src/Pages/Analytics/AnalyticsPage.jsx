import React, { useEffect, useState,useRef } from 'react';
import './AnalyticsPage.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams } from "react-router-dom";
import LineChartComponent from "../../Components/Charts/LineChartComponent";
import { backend, python } from '../../../data';
import Navbar from '../../Components/Navbar/Navbar';
import { isArray } from 'chart.js/helpers';
import StatCard from '../../Components/Charts/StatCard';

const gradeToScore = {
  A: 10,
  B: 9,
  C: 8,
  D: 7,
  E: 6,
};

// Utility to convert scores to chart data format
const convertScoresToChartData = (scores) => {
  return scores.map((score, index) => ({
    attempt: `Attempt ${index + 1}`,
    score,
  }));
};

const WeaknessAnalytics = ({ data }) => {
  if (!isArray(data)) return null;

  const weakTopics = data.filter(item => {
    const key = Object.keys(item)[0];
    return item[key].grade === "E";
  });

  return (
    <section className="weakness-section">
      <h2>📉 Weakness Analytics</h2>
      <p>Here are the topics you need to improve:</p>
      {weakTopics.length === 0 ? (
        <p>No weak topics found. Great job!</p>
      ) : (
        <ul className="weak-topics">
          {weakTopics.map((item, index) => {
            const topic = Object.keys(item)[0];
            return <li key={index}>{topic}</li>;
          })}
        </ul>
      )}
    </section>
  );
};
// In AnalyticsPage.js

const SummaryStats = ({ analyticsData, readData }) => {
  if (!analyticsData[0] || !readData[0]) return null;

  return (
    <section className="summary-stats-container">
      <StatCard label="Total Questions Attempted" value={analyticsData[0].out_total} subtext="Questions" />
      <StatCard label="Total Correct Questions" value={analyticsData[0].out_correct} subtext="Questions" />
      <StatCard label="Total Time Spent on Quiz" value={analyticsData[0].out_total_time} subtext="Seconds" />
      <StatCard label="Total Time Spent on Studying" value={readData[0].total_sum_per_user} subtext="Seconds" />
    </section>
  );
};


const ReportCard = ({ data, finalGrade }) => {
  if (!isArray(data)) return null;

  return (
    <section className="report-card-section">
      <h2>🎓 Report Card</h2>
      <button onClick={() => window.print()} className="print-button">
        Print Report
      </button>

      <div className="report-card">
        <div className="report-header grid-row">
          <div>Topic</div>
          <div>Grade</div>
          <div>Tips</div>
        </div>

        {data.map((row, index) => {
          const topic = Object.keys(row)[0];
          const { grade, tips } = row[topic];
          return (
            <div className="report-row grid-row" key={index}>
              <div>{topic}</div>
              <div>
                <span className={`grade-badge grade-${grade.toLowerCase()}`}>
                  {grade}
                </span>
              </div>
              <div>
                <ul className="tips-list">
                  {tips.map((tip, tipIndex) => (
                    <li key={tipIndex}>
                      <span className="tip-icon">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}

        <div className="final-grade">
          Final Grade: <strong>{finalGrade.toFixed(2)}</strong>
        </div>
      </div>

      <div className="signature">© 2025 — NeuraLearn.com</div>
    </section>
  );
};

const AnalyticsPage = () => {
  const { id } = useParams();
  const [finalGrade, setFinalGrade] = useState(0);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [weaknessData, setWeaknessData] = useState([]);
  const [readData, setReadData] = useState([]);
  const [lineData, setLineData] = useState([]);

  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  };

  // Fetch Analytics Data
  const fetchAnalytics = async () => {
    try {
      const response = await axios.post(`${backend}api/curriculum/analytics`, {
        user_id: getUserId(),
        curr_id: id,
      });
      if (!response.data.success) {
        toast.error(response.data.message);
      } else {
        setAnalyticsData(response.data.data || []);
        setReadData(response.data.read || []);
        setLineData(response.data.linedata || []);

      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
    }
  };

  // Fetch Weakness Data
  const fetchWeakness = async () => {
    console.log("Hello")
    try {
      const response = await axios.post(`${python}weakness`, {
        user_id: getUserId(),
        curr_id: id,
      });
      if (!response.data.success) {
        toast.error("Unable to detect Weakness");
      } else {
        const weaknessList = response.data.data || [];
        setWeaknessData(weaknessList);

        const totalTopics = weaknessList.length;
        if (totalTopics === 0) {
          setFinalGrade(0);
          return;
        }

        const totalScore = weaknessList.reduce((acc, item) => {
          const key = Object.keys(item)[0];
          return acc + (gradeToScore[item[key].grade] || 0);
        }, 0);

        setFinalGrade(totalScore / totalTopics);
        toast.info("+5XP Added!🎉");
        if (response.data.passed > 0) {
          toast.info(`Wohoo! Level ${response.data.passed + 1} Reached🎉`);
        }
      }
    } catch (error) {
      console.error("Weakness fetch error:", error);
    }
  };

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchAnalytics();
    fetchWeakness();
  }, [id]);

  return (
    <div>
      <Navbar />
      <div className="analytics-container">
        <WeaknessAnalytics data={weaknessData} />

        {lineData.length > 0 && lineData[0].score_array && (
          <LineChartComponent
            data={convertScoresToChartData(lineData[0].score_array)}
            xKey="attempt"
            yKey="score"
            title="Your Score Progress"
          />
        )}

        <SummaryStats analyticsData={analyticsData} readData={readData} />

        <ReportCard data={weaknessData} finalGrade={finalGrade} />
      </div>
    </div>
  );
};

export default AnalyticsPage;
