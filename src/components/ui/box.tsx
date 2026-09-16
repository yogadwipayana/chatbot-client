import { cx } from "@/lib/utils"

import styles from "./box.module.css"

/** Kotak konten AdminLTE (`.box.box-danger`) dengan garis merah di atas. */
export function Box({
  title,
  className,
  children,
}: {
  title?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cx(styles.box, className)}>
      {title && (
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
