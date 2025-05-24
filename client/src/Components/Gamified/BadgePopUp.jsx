import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./BadgePopUp.css";

const BadgePopUp = ({ show, badge, onClose }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="badge-popup-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="badge-popup-container"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <div className="badge-popup-emoji">{badge.emoji}</div>
          <h2 className="badge-popup-title">{badge.text}</h2>
          <p className="badge-popup-description">{badge.description}</p>
          <button onClick={onClose} className="badge-popup-button">
            Continue
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BadgePopUp;
