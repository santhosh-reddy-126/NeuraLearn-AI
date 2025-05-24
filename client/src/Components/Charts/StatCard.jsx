import React from 'react';

const StatCard = ({ label = "Label", value = "Value", subtext = "on this" }) => {
  const styles = {
    card: {
      background: 'linear-gradient(135deg, #fafdff 0%, #f7f9fb 100%)',  // ONLY Light Sky to Light Grey Blue
      border: '1px solid #e2e8f0', // Light Grey border as per your palette
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '320px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', // subtle shadow
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: '#222222', // Dark Text for primary text color
    },
    label: {
      fontSize: '12px',
      textTransform: 'uppercase',
      color: '#222222', // Dark Text for label too, consistent
      fontWeight: '600',
      marginBottom: '6px',
    },
    value: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '4px',
    },
    subtext: {
      fontSize: '14px',
      color: '#444444', // Neutral color for subtext
      margin: 0,
    },
  };

  return (
    <div style={styles.card}>
      <p style={styles.label}>{label}</p>
      <h2 style={styles.value}>{value}</h2>
      {subtext && <p style={styles.subtext}>{subtext}</p>}
    </div>
  );
};

export default StatCard;
