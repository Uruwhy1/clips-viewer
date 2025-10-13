import styles from "./PageCover.module.css"

type PageCoverProps = {
  onClick: () => void
  z?: number | string;
}

const PageCover: React.FC<PageCoverProps> = ({ onClick, z = 2 }) => {
  return <div onClick={onClick} style={{ zIndex: z }} className={styles.cover}></div>
}

export default PageCover

