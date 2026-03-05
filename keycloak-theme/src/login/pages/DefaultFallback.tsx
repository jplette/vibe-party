import type { KcContext } from "keycloakify/login/KcContext";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";

interface Props {
    kcContext: KcContext;
}

/**
 * Minimal fallback for Keycloak pages we haven't custom-styled yet.
 * The page ID is shown so developers know which page needs implementation.
 */
export default function DefaultFallback({ kcContext }: Props) {
    return (
        <AuthCard>
            <Logo />
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
                    Page: <code style={{ fontFamily: "monospace", background: "#f0f0f0", padding: "0.125rem 0.375rem", borderRadius: "3px" }}>{kcContext.pageId}</code>
                </p>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-subtle)" }}>
                    This page has not been custom-styled yet. Add it to{" "}
                    <code style={{ fontFamily: "monospace" }}>src/login/KcPage.tsx</code>.
                </p>
            </div>
        </AuthCard>
    );
}
