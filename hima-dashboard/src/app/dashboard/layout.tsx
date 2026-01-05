import DashboardShell from "@/components/layout/DashboardShell";
import { LogsProvider } from "@/context/LogsContext";
import WhatsAppChat from "@/components/chat/WhatsAppChat";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LogsProvider>
            <DashboardShell>
                {children}
                <WhatsAppChat />
            </DashboardShell>
        </LogsProvider>
    );
}
