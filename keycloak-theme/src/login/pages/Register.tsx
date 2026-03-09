import { useState } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import {
    Button,
    Callout,
    Flex,
    Grid,
    Text,
    TextField,
} from "@radix-ui/themes";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

type RegisterKcContext = Extract<KcContext, { pageId: "register.ftl" }>;

interface Props {
    kcContext: RegisterKcContext;
}

export default function Register({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url, realm } = kcContext;
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const fieldError = (field: string): string | null => {
        if (!kcContext.messagesPerField?.existsError(field)) return null;
        return kcContext.messagesPerField.getFirstError(field) ?? null;
    };

    const fieldColor = (field: string): "red" | undefined =>
        kcContext.messagesPerField?.existsError(field) ? "red" : undefined;

    return (
        <AuthCard>
            <Logo />
            <Text as="p" size="4" weight="bold" align="center" mb="4"
                style={{ margin: "0 0 1.25rem", color: "var(--color-nav, #004e89)" }}>
                Create your account
            </Text>

            <form
                action={url.registrationAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
            >
                <Flex direction="column" gap="3">
                    {/* First name + Last name */}
                    <Grid columns="2" gap="3">
                        <label>
                            <Text as="div" size="2" weight="bold" mb="1">
                                {i18n.msgStr("firstName")}
                            </Text>
                            <TextField.Root
                                id="firstName"
                                name="firstName"
                                autoFocus
                                size="2"
                                color={fieldColor("firstName")}
                            />
                            {fieldError("firstName") && (
                                <Text as="p" size="1" color="red" mt="1" style={{ margin: "0.25rem 0 0" }}>
                                    {fieldError("firstName")}
                                </Text>
                            )}
                        </label>
                        <label>
                            <Text as="div" size="2" weight="bold" mb="1">
                                {i18n.msgStr("lastName")}
                            </Text>
                            <TextField.Root
                                id="lastName"
                                name="lastName"
                                size="2"
                                color={fieldColor("lastName")}
                            />
                            {fieldError("lastName") && (
                                <Text as="p" size="1" color="red" mt="1" style={{ margin: "0.25rem 0 0" }}>
                                    {fieldError("lastName")}
                                </Text>
                            )}
                        </label>
                    </Grid>

                    {/* Email */}
                    <label>
                        <Text as="div" size="2" weight="bold" mb="1">
                            {i18n.msgStr("email")}
                        </Text>
                        <TextField.Root
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            size="2"
                            color={fieldColor("email")}
                        />
                        {fieldError("email") && (
                            <Text as="p" size="1" color="red" mt="1" style={{ margin: "0.25rem 0 0" }}>
                                {fieldError("email")}
                            </Text>
                        )}
                    </label>

                    {/* Username (only when email is not used as username) */}
                    {!realm.registrationEmailAsUsername && (
                        <label>
                            <Text as="div" size="2" weight="bold" mb="1">
                                {i18n.msgStr("username")}
                            </Text>
                            <TextField.Root
                                id="username"
                                name="username"
                                autoComplete="username"
                                size="2"
                                color={fieldColor("username")}
                            />
                            {fieldError("username") && (
                                <Text as="p" size="1" color="red" mt="1" style={{ margin: "0.25rem 0 0" }}>
                                    {fieldError("username")}
                                </Text>
                            )}
                        </label>
                    )}

                    {/* Password */}
                    <label>
                        <Text as="div" size="2" weight="bold" mb="1">
                            {i18n.msgStr("password")}
                        </Text>
                        <TextField.Root
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            size="2"
                            color={fieldColor("password")}
                        >
                            <TextField.Slot side="right">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(prev => !prev)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "0 2px",
                                        display: "flex",
                                        alignItems: "center",
                                        color: "var(--gray-9)",
                                    }}
                                >
                                    {showPassword
                                        ? <EyeClosedIcon width="16" height="16" />
                                        : <EyeOpenIcon width="16" height="16" />
                                    }
                                </button>
                            </TextField.Slot>
                        </TextField.Root>
                        {fieldError("password") && (
                            <Text as="p" size="1" color="red" mt="1" style={{ margin: "0.25rem 0 0" }}>
                                {fieldError("password")}
                            </Text>
                        )}
                    </label>

                    {/* Password confirm */}
                    <label>
                        <Text as="div" size="2" weight="bold" mb="1">
                            {i18n.msgStr("passwordConfirm")}
                        </Text>
                        <TextField.Root
                            id="password-confirm"
                            name="password-confirm"
                            type={showPasswordConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            size="2"
                            color={fieldColor("password-confirm")}
                        >
                            <TextField.Slot side="right">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm(prev => !prev)}
                                    aria-label={showPasswordConfirm ? "Hide confirm password" : "Show confirm password"}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "0 2px",
                                        display: "flex",
                                        alignItems: "center",
                                        color: "var(--gray-9)",
                                    }}
                                >
                                    {showPasswordConfirm
                                        ? <EyeClosedIcon width="16" height="16" />
                                        : <EyeOpenIcon width="16" height="16" />
                                    }
                                </button>
                            </TextField.Slot>
                        </TextField.Root>
                        {fieldError("password-confirm") && (
                            <Text as="p" size="1" color="red" mt="1" style={{ margin: "0.25rem 0 0" }}>
                                {fieldError("password-confirm")}
                            </Text>
                        )}
                    </label>

                    {/* Global form-level error message */}
                    {kcContext.message?.type === "error" && (
                        <Callout.Root color="red" role="alert">
                            <Callout.Text>{kcContext.message.summary}</Callout.Text>
                        </Callout.Root>
                    )}

                    <Button
                        type="submit"
                        size="3"
                        loading={isSubmitDisabled}
                        disabled={isSubmitDisabled}
                        style={{ width: "100%", cursor: isSubmitDisabled ? "not-allowed" : "pointer" }}
                    >
                        {i18n.msgStr("doRegister")}
                    </Button>
                </Flex>
            </form>

            <Text as="p" size="2" align="center" color="gray" mt="4" style={{ margin: "1rem 0 0" }}>
                {i18n.msg("backToLogin")}{" "}
                <Text asChild weight="bold" style={{ color: "var(--accent-9)" }}>
                    <a href={url.loginUrl}>{i18n.msgStr("doLogIn")}</a>
                </Text>
            </Text>
        </AuthCard>
    );
}
