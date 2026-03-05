import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { Button } from "primereact/button";

type LoginVerifyEmailKcContext = Extract<KcContext, { pageId: "login-verify-email.ftl" }>;

interface Props {
    kcContext: LoginVerifyEmailKcContext;
}

export default function LoginVerifyEmail({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url } = kcContext;

    return (
        <AuthCard>
            <Logo />
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "50%",
                    background: "var(--color-primary-lightest, #fff3ed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.25rem",
                    fontSize: "1.5rem"
                }}>
                    <i className="pi pi-envelope" style={{ color: "var(--color-primary)", fontSize: "1.25rem" }} />
                </div>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-nav)", marginTop: 0, marginBottom: "0.5rem" }}>
                    {i18n.msgStr("emailVerifyTitle")}
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                    {i18n.msgStr("emailVerifyInstruction1")}
                </p>

                <form action={url.loginAction} method="post">
                    <Button type="submit" label={i18n.msgStr("doClickHere")} style={{ width: "100%" }} />
                </form>

                <p style={{ marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                    {i18n.msgStr("emailVerifyInstruction2")}{" "}
                    <a href={url.loginAction} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                        {i18n.msgStr("doClickHere")}
                    </a>{" "}
                    {i18n.msgStr("emailVerifyInstruction3")}
                </p>
            </div>
        </AuthCard>
    );
}
