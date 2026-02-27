import { Sidebar } from "@/components/layout/Sidebar";
import { LayoutShell } from "@/components/layout/LayoutShell";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Sidebar />
            <LayoutShell>{children}</LayoutShell>
        </>
    );
}
