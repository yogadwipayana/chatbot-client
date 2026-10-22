import { ChatWidget } from "@/components/chat/chat-widget"
import { GerbangLoginSads } from "@/components/layout/login-sads"
import { PortalShell } from "@/components/layout/portal-shell"

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <GerbangLoginSads>
      <PortalShell>{children}</PortalShell>
      <ChatWidget />
    </GerbangLoginSads>
  )
}
