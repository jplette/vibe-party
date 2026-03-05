import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export default function AuthCard({ children }: Props) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-surface-beige-faint, #f9f9ee)",
            padding: "1.5rem",
            fontFamily: "'Lato', sans-serif"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "440px",
                background: "var(--color-surface-card, #ffffff)",
                borderRadius: "var(--radius-lg, 14px)",
                boxShadow: "var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04))",
                padding: "2.5rem 2rem",
            }}>
                {children}
            </div>
        </div>
    );
}
