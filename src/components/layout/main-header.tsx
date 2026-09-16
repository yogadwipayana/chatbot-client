import Link from "next/link"
import { FaAngleDown, FaBars } from "react-icons/fa"

import styles from "./main-header.module.css"

export function MainHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        SADS
      </Link>
      <nav className={styles.navbar} aria-label="Navigasi atas">
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggleSidebar}
          aria-label="Tampilkan atau sembunyikan navigasi"
        >
          <FaBars aria-hidden />
        </button>
        <div className={styles.actions}>
          <label className={styles.role}>
            <span className="sr-only">Peran</span>
            <select defaultValue="mahasiswa">
              <option value="mahasiswa">Mahasiswa</option>
            </select>
            <FaAngleDown aria-hidden />
          </label>
          <a href="#" className={styles.link}>
            Setting
          </a>
        </div>
      </nav>
    </header>
  )
}
