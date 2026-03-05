import { useState } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

interface Props {
    kcContext: RegisterKcContext;
}

export default function Register({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url, realm } = kcContext;
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const labelStyle: React.CSSProperties = {
        display: "block",
        marginBottom: "0.375rem",
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "var(--color-text)"
    };

    const fieldError = (field: string) => {
        const exists = kcContext.messagesPerField?.existsError(field);
        if (!exists) return null;
        return (
            <small style={{ color: "var(--color-danger)", fontSize: "0.8125rem", marginTop: "0.25rem", display: "block" }}>
                {kcContext.messagesPerField?.getFirstError(field)}
            </small>
        );
    };

    return (
        <AuthCard>
            <Logo />
            <h2 style={{ textAlign: "center", fontSize: "1.125rem", fontWeight: 700, color: "var(--color-nav)", marginTop: 0, marginBottom: "1.5rem" }}>
                Create your account
            </h2>

            <form action={url.registrationAction} method="post" onSubmit={() => setIsSubmitDisabled(true)}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                        <label htmlFor="firstName" style={labelStyle}>
                            {i18n.msgStr("firstName")}
                        </label>
                        <InputText id="firstName" name="firstName" autoFocus style={{ width: "100%" }} />
                        {fieldError("firstName")}
                    </div>
                    <div>
                        <label htmlFor="lastName" style={labelStyle}>
                            {i18n.msgStr("lastName")}
                        </label>
                        <InputText id="lastName" name="lastName" style={{ width: "100%" }} />
                        {fieldError("lastName")}
                    </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="email" style={labelStyle}>
                        {i18n.msgStr("email")}
                    </label>
                    <InputText id="email" name="email" type="email" autoComplete="email" style={{ width: "100%" }} />
                    {fieldError("email")}
                </div>

                {!realm.registrationEmailAsUsername && (
                    <div style={{ marginBottom: "1rem" }}>
                        <label htmlFor="username" style={labelStyle}>
                            {i18n.msgStr("username")}
                        </label>
                        <InputText id="username" name="username" autoComplete="username" style={{ width: "100%" }} />
                        {fieldError("username")}
                    </div>
                )}

                <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="password" style={labelStyle}>
                        {i18n.msgStr("password")}
                    </label>
                    <Password
                        inputId="password"
                        name="password"
                        autoComplete="new-password"
                        feedback
                        toggleMask
                        style={{ width: "100%" }}
                        inputStyle={{ width: "100%" }}
                    />
                    {fieldError("password")}
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                    <label htmlFor="password-confirm" style={labelStyle}>
                        {i18n.msgStr("passwordConfirm")}
                    </label>
                    <Password
                        inputId="password-confirm"
                        name="password-confirm"
                        autoComplete="new-password"
                        feedback={false}
                        toggleMask
                        style={{ width: "100%" }}
                        inputStyle={{ width: "100%" }}
                    />
                    {fieldError("password-confirm")}
                </div>

                <Button
                    type="submit"
                    label={i18n.msgStr("doRegister")}
                    disabled={isSubmitDisabled}
                    style={{ width: "100%", marginBottom: "1.25rem" }}
                />
            </form>

            <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
                {i18n.msgStr("backToLogin")}{" "}
                <a href={url.loginUrl} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                    {i18n.msgStr("doLogIn")}
                </a>
            </p>
        </AuthCard>
    );
}
