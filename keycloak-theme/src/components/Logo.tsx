export default function Logo() {
    return (
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <span style={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 900,
                fontSize: "1.75rem",
                letterSpacing: "-0.02em",
                color: "var(--color-primary, #ff6b35)"
            }}>
                vibe
            </span>
            <span style={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 300,
                fontSize: "1.75rem",
                letterSpacing: "-0.02em",
                color: "var(--color-nav, #004e89)"
            }}>
                party
            </span>
        </div>
    );
}
