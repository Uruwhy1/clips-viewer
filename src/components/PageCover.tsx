import styles from "./PageCover.module.css"

type PageCoverProps = {
  onClick: () => void
  z?: number | string;
}

const PageCover: React.FC<PageCoverProps> = ({ onClick, z = 0 }) => {
  return (
    <div
      onClick={onClick}
      style={{ zIndex: z }}
      className={styles.cover}
    />
  )
}

export default PageCover
