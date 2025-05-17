import React from "react";
import "./Loading.css";

const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner">
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
      <div className="loading-dot"></div>
    </div>
  </div>
);

export default Loading;