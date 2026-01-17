import DashboardShell from "@/components/layout/DashboardShell";
import { LogsProvider } from "@/context/LogsContext";
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <LogsProvider>
            <DashboardShell>
                {children}
            </DashboardShell>
        </LogsProvider>
    );
}
