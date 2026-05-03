import styles from "./ClipsSkeleton.module.css"; // Create this CSS module

const ClipsSkeleton = () => {
  return (
    <div className={styles.skeletonItem}>
      <div className={styles.thumbnail}></div>
      <div className={styles.text}></div>
    </div>
  );
};

export default ClipsSkeleton;
