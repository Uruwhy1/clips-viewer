import { useContext, useEffect, useState } from "react";
import styles from "./CustomVideoBar.module.css";
import GlobalContext from "../contexts/GlobalContext";

const CustomVideoBar = ({
  duration,
  currentTime,
  startTime,
  endTime,
  formatTime,
  videoRef,
}) => {
  const { currentClip } = useContext(GlobalContext);
  const [timeIntervals, setTimeIntervals] = useState([]);

  const handleSeek = (event) => {
    if (videoRef.current) {
      const newTime =
        (event.nativeEvent.offsetX / event.target.offsetWidth) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  const generateTimeIntervals = (videoDuration) => {
    const intervalOptions = [1, 5, 10, 30, 60, 300, 600];
    const styles = ["markerMini", "markerSmall", "markerMedium", "markerBig"];

    const selectedIntervals = intervalOptions.filter(
      (interval) =>
        interval * 2 < videoDuration && interval * 200 > videoDuration
    );

    const markers = [];
    let count = Math.max(0, 3 - selectedIntervals.length);

    selectedIntervals.slice(-4).forEach((interval) => {
      for (let time = interval; time < videoDuration; time += interval) {
        markers.push({
          time,
          percentage: (time / videoDuration) * 100,
          style: styles[count],
        });
      }
      count++;
    });

    return markers;
  };

  useEffect(() => {
    if (duration > 0) {
      setTimeIntervals(generateTimeIntervals(duration));
    }
  }, [currentClip, duration]);

  return (
    <div className={styles.customVideoBar} onClick={handleSeek}>
      <div
        className={styles.progress}
        style={{ width: `${(currentTime / duration) * 100}%` }}
      ></div>
      {timeIntervals.map((marker, index) => (
        <div
          key={index}
          className={`${styles.marker} ${styles[marker.style]}`}
          style={{ left: `${marker.percentage}%` }}
          title={`${marker.label} marker`}
        />
      ))}
      {startTime && (
        <div
          className={styles.start}
          style={{ left: `${(startTime / duration) * 100}%` }}
        ></div>
      )}
      {startTime && endTime && (
        <div
          className={styles.clipMarker}
          style={{
            left: `${(startTime / duration) * 100}%`,
            width: `calc(${(endTime / duration) * 100}% - ${
              (startTime / duration) * 100
            }%)`,
          }}
        ></div>
      )}
      {endTime && (
        <div
          className={styles.end}
          style={{ left: `${(endTime / duration) * 100}%` }}
        ></div>
      )}
      <div className={styles.durationLabels}>
        <span className={styles.timeLabel}>00:00</span>
        <span className={styles.timeLabel}>{formatTime(duration / 2)}</span>
        <span className={styles.timeLabel}>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default CustomVideoBar;
