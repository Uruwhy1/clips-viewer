import { useEffect, useState } from "react";
import "./spinner.css";

function Spinner() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 500);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`spinner-container ${fadeOut ? "fade-out" : ""}`}>
      <div className="spinner"></div>
    </div>
  );
}

export default Spinner;
