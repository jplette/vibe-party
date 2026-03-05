import { useState } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";

type LoginKcContext = Extract<KcContext, { pageId: "login.ftl" }>;

interface Props {
    kcContext: LoginKcContext;
}

export default function Login({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url, realm, login, social } = kcContext;
    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const labelStyle: React.CSSProperties = {
        display: "block",
        marginBottom: "0.375rem",
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "var(--color-text)"
    };

    return (
        <AuthCard>
            <Logo />

            {kcContext.message && kcContext.message.type !== "warning" && (
                <div style={{
                    padding: "0.75rem 1rem",
                    marginBottom: "1.25rem",
                    borderRadius: "var(--radius-sm)",
                    background: kcContext.message.type === "error" ? "#fff5f5" : "var(--color-success-bg)",
                    color: kcContext.message.type === "error" ? "var(--color-danger)" : "var(--color-success)",
                    border: `1px solid ${kcContext.message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                    fontSize: "0.875rem"
                }}>
                    {kcContext.message.summary}
                </div>
            )}

            <form action={url.loginAction} method="post" onSubmit={() => setIsLoginButtonDisabled(true)}>
                <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="username" style={labelStyle}>
                        {!realm.loginWithEmailAllowed
                            ? i18n.msgStr("username")
                            : !realm.registrationEmailAsUsername
                            ? i18n.msgStr("usernameOrEmail")
                            : i18n.msgStr("email")}
                    </label>
                    <InputText
                        id="username"
                        name="username"
                        defaultValue={login.username ?? ""}
                        autoFocus
                        autoComplete="username"
                        style={{ width: "100%" }}
                    />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                        <label htmlFor="password" style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text)" }}>
                            {i18n.msgStr("password")}
                        </label>
                        {realm.resetPasswordAllowed && (
                            <a href={url.loginResetCredentialsUrl} style={{ fontSize: "0.8125rem", color: "var(--color-nav)" }}>
                                {i18n.msgStr("doForgotPassword")}
                            </a>
                        )}
                    </div>
                    <Password
                        inputId="password"
                        name="password"
                        autoComplete="current-password"
                        feedback={false}
                        toggleMask
                        style={{ width: "100%" }}
                        inputStyle={{ width: "100%" }}
                    />
                </div>

                {realm.rememberMe && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                        <Checkbox
                            inputId="rememberMe"
                            name="rememberMe"
                            checked={login.rememberMe === "on"}
                            onChange={() => {/* controlled via form */}}
                        />
                        <label htmlFor="rememberMe" style={{ fontSize: "0.875rem", cursor: "pointer" }}>
                            {i18n.msgStr("rememberMe")}
                        </label>
                    </div>
                )}

                <Button
                    type="submit"
                    label={i18n.msgStr("doLogIn")}
                    disabled={isLoginButtonDisabled}
                    style={{ width: "100%", marginBottom: "1.25rem" }}
                />

                <input type="hidden" name="credentialId" value={kcContext.auth?.selectedCredential ?? ""} />
            </form>

            {realm.password && realm.registrationAllowed && (
                <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-muted)", margin: "0" }}>
                    {i18n.msgStr("noAccount")}{" "}
                    <a href={url.registrationUrl} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                        {i18n.msgStr("doRegister")}
                    </a>
                </p>
            )}

            {social && social.providers && social.providers.length > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                    <div style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                        or continue with
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {social.providers.map(provider => (
                            <a
                                key={provider.providerId}
                                href={provider.loginUrl}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    padding: "0.625rem 1rem",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "0.875rem",
                                    fontWeight: 600,
                                    color: "var(--color-text)",
                                    textDecoration: "none",
                                    background: "#fff",
                                    transition: "var(--transition-fast)"
                                }}
                            >
                                {provider.displayName}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </AuthCard>
    );
}
