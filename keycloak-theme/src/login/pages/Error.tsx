import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { Button } from "primereact/button";

type ErrorKcContext = Extract<KcContext, { pageId: "error.ftl" }>;

interface Props {
    kcContext: ErrorKcContext;
}

export default function Error({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });

    return (
        <AuthCard>
            <Logo />
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "50%",
                    background: "#fff5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem",
                    fontSize: "1.5rem"
                }}>
                    <i className="pi pi-exclamation-triangle" style={{ color: "var(--color-danger)", fontSize: "1.25rem" }} />
                </div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-danger, #dc3545)", marginTop: 0, marginBottom: "0.75rem" }}>
                    {i18n.msgStr("errorTitle")}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
                    {kcContext.message.summary}
                </p>
                {kcContext.client?.baseUrl && (
                    <Button
                        label="Back to application"
                        onClick={() => { window.location.href = kcContext.client!.baseUrl!; }}
                        style={{ width: "100%" }}
                    />
                )}
            </div>
        </AuthCard>
    );
}
