import type { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

const EMOJI_BUBBLES = [
    { emoji: "🎉", top: "10%",  left: "8%",   delay: "0s",    duration: "4s"   },
    { emoji: "🥳", top: "20%",  left: "88%",  delay: "0.8s",  duration: "5s"   },
    { emoji: "🎊", top: "65%",  left: "5%",   delay: "1.6s",  duration: "4.5s" },
    { emoji: "🎈", top: "75%",  left: "90%",  delay: "0.4s",  duration: "3.8s" },
    { emoji: "🎶", top: "45%",  left: "92%",  delay: "1.2s",  duration: "4.2s" },
    { emoji: "🍕", top: "85%",  left: "15%",  delay: "2s",    duration: "5.2s" },
];

export default function AuthCard({ children }: Props) {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-surface-beige-faint, #f9f9ee)",
            padding: "1.5rem",
            fontFamily: "'Lato', sans-serif",
            position: "relative",
            overflow: "hidden"
        }}>
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-16px); }
                }
            `}</style>

            {EMOJI_BUBBLES.map(({ emoji, top, left, delay, duration }) => (
                <div
                    key={emoji}
                    style={{
                        position: "absolute",
                        top,
                        left,
                        width: "68px",
                        height: "68px",
                        borderRadius: "50%",
                        background: "#ffffff",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        animation: `float ${duration} ease-in-out ${delay} infinite`,
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 0
                    }}
                >
                    {emoji}
                </div>
            ))}

            <div style={{
                width: "100%",
                maxWidth: "440px",
                background: "var(--color-surface-card, #ffffff)",
                borderRadius: "var(--radius-lg, 14px)",
                boxShadow: "var(--shadow-lg, 0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04))",
                padding: "2.5rem 2rem",
                position: "relative",
                zIndex: 1
            }}>
                {children}
            </div>
        </div>
    );
}
