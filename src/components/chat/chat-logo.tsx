/**
 * Logo asisten di kepala panel: balon obrolan putih bergaris tebal dengan
 * bayangan padat. Sama dengan logo dashboard admin dan ikon tab
 * (`balon-bayangan`); arsip dan cara menggantinya ada di `docs/logo/README.md`.
 *
 * Warnanya tetap hitam putih (bukan `currentColor`) supaya bentuknya tidak
 * hilang di kepala panel yang merah.
 */
const BALON =
  "M8 4h12a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5h-7.5l-4.6 3.8c-.6.5-1.4.1-1.4-.7V20.6A5 5 0 0 1 3 16V9a5 5 0 0 1 5-5z"

export function ChatLogo() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden focusable="false">
      <path fill="#171717" transform="translate(3.5 3.5)" d={BALON} />
      <path fill="#fff" stroke="#171717" strokeWidth="2.4" strokeLinejoin="round" d={BALON} />
      <path
        fill="none"
        stroke="#171717"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M8.5 10.5h11M8.5 15h6.5"
      />
    </svg>
  )
}
