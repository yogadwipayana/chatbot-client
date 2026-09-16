import Image from "next/image"
import type { IconType } from "react-icons"
import {
  FaAngleLeft,
  FaBuilding,
  FaCalendarAlt,
  FaHome,
  FaPaperPlane,
  FaRegEdit,
  FaRegFolderOpen,
  FaTh,
  FaUser,
} from "react-icons/fa"

import { student } from "@/lib/portal-data"
import { cx } from "@/lib/utils"

import styles from "./main-sidebar.module.css"

type NavItem = {
  label: string
  icon: IconType
  /** Menu bertingkat di SADS; ditandai panah seperti aslinya. */
  treeview?: boolean
  active?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", icon: FaHome, active: true },
  { label: "Presensi", icon: FaCalendarAlt },
  { label: "Korti", icon: FaRegFolderOpen },
  { label: "Dies Natalis", icon: FaCalendarAlt, treeview: true },
  { label: "Biodata", icon: FaUser, treeview: true },
  { label: "Administrasi Keuangan", icon: FaTh, treeview: true },
  { label: "Usulan Matkul SP", icon: FaPaperPlane, treeview: true },
  { label: "KRS PLK", icon: FaPaperPlane, treeview: true },
  { label: "Pengajuan KRS", icon: FaPaperPlane, treeview: true },
  { label: "Pengajuan KRS SP", icon: FaPaperPlane, treeview: true },
  { label: "Kerja Praktik", icon: FaBuilding, treeview: true },
  { label: "Seminar", icon: FaRegEdit, treeview: true },
  { label: "Skripsi", icon: FaRegEdit, treeview: true },
]

export function MainSidebar({ className }: { className?: string }) {
  return (
    <aside className={cx(styles.sidebar, className)}>
      <div className={styles.userPanel}>
        {/* Ganti public/logo.svg dengan logo kampus. */}
        <Image src="/logo.svg" alt="Logo kampus" width={45} height={45} unoptimized />
        <div className={styles.userInfo}>
          <p className={styles.nim}>{student.nim}</p>
          <p className={styles.period}>
            <FaCalendarAlt aria-hidden /> {student.periode}
          </p>
        </div>
      </div>

      <nav aria-label="Navigasi utama">
        <ul className={styles.menu}>
          <li className={styles.menuHeader}>MAIN NAVIGATION</li>
          {NAV_ITEMS.map(({ label, icon: Icon, treeview, active }) => (
            <li key={label} className={cx(active && styles.active)}>
              <a href="#" aria-current={active ? "page" : undefined}>
                <Icon className={styles.icon} aria-hidden />
                <span className={styles.label}>{label}</span>
                {treeview && <FaAngleLeft className={styles.caret} aria-hidden />}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
