import type { Metadata } from "next"

import { LoginForm } from "@/components/login/login-form"

export const metadata: Metadata = {
  title: "Sign In",
}

/** Tiruan Sign In SADS; membukanya berarti keluar, seperti di SADS. */
export default function MasukPage() {
  return <LoginForm />
}
