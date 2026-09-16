"use client"

import { useState } from "react"

import { cx } from "@/lib/utils"

import { MainHeader } from "./main-header"
import { MainSidebar } from "./main-sidebar"
import styles from "./portal-shell.module.css"

/**
 * Kerangka AdminLTE: header, sidebar, dan area konten.
 *
 * Satu status `toggled` untuk dua perilaku, seperti AdminLTE: di desktop
 * menyembunyikan sidebar yang semula tampil, di layar sempit memunculkan sidebar
 * yang semula tersembunyi.
 */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const [toggled, setToggled] = useState(false)

  return (
    <div className={cx(styles.wrapper, toggled && styles.toggled)}>
      <MainHeader onToggleSidebar={() => setToggled((value) => !value)} />
      <MainSidebar className={styles.sidebar} />
      {toggled && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Tutup navigasi"
          onClick={() => setToggled(false)}
        />
      )}
      <main className={styles.content}>{children}</main>
    </div>
  )
}
