import { useState } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";

type LoginResetPasswordKcContext = Extract<KcContext, { pageId: "login-reset-password.ftl" }>;

interface Props {
    kcContext: LoginResetPasswordKcContext;
}

export default function LoginResetPassword({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url, realm } = kcContext;
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    return (
        <AuthCard>
            <Logo />
            <h2 style={{ textAlign: "center", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-nav)", marginTop: 0, marginBottom: "0.5rem" }}>
                {i18n.msgStr("emailForgotTitle")}
            </h2>
            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 0, marginBottom: "1.5rem" }}>
                Enter your email and we'll send you a reset link.
            </p>

            <form action={url.loginAction} method="post" onSubmit={() => setIsSubmitDisabled(true)}>
                <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="username" style={{ display: "block", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.375rem" }}>
                        {!realm.loginWithEmailAllowed
                            ? i18n.msgStr("username")
                            : !realm.registrationEmailAsUsername
                            ? i18n.msgStr("usernameOrEmail")
                            : i18n.msgStr("email")}
                    </label>
                    <InputText
                        id="username"
                        name="username"
                        autoFocus
                        autoComplete="username"
                        style={{ width: "100%" }}
                    />
                </div>

                <Button
                    type="submit"
                    label={i18n.msgStr("doSubmit")}
                    disabled={isSubmitDisabled}
                    style={{ width: "100%", marginBottom: "1.25rem" }}
                />
            </form>

            <p style={{ textAlign: "center", margin: 0 }}>
                <a href={url.loginUrl} style={{ fontSize: "0.875rem", color: "var(--color-nav)" }}>
                    {i18n.msg("backToLogin")}
                </a>
            </p>
        </AuthCard>
    );
}
