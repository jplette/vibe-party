import { useState } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { Button, Flex, Text, TextField } from "@radix-ui/themes";

type LoginResetPasswordKcContext = Extract<KcContext, { pageId: "login-reset-password.ftl" }>;

interface Props {
    kcContext: LoginResetPasswordKcContext;
}

export default function LoginResetPassword({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url, realm } = kcContext;
    const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

    const inputLabel = !realm.loginWithEmailAllowed
        ? i18n.msgStr("username")
        : !realm.registrationEmailAsUsername
        ? i18n.msgStr("usernameOrEmail")
        : i18n.msgStr("email");

    return (
        <AuthCard>
            <Logo />
            <Text as="p" size="4" weight="bold" align="center"
                style={{ margin: "0 0 0.375rem", color: "var(--color-nav, #004e89)" }}>
                {i18n.msgStr("emailForgotTitle")}
            </Text>
            <Text as="p" size="2" align="center" color="gray" style={{ margin: "0 0 1.5rem" }}>
                Enter your email and we'll send you a reset link.
            </Text>

            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsSubmitDisabled(true)}
            >
                <Flex direction="column" gap="4">
                    <label>
                        <Text as="div" size="2" weight="bold" mb="1">
                            {inputLabel}
                        </Text>
                        <TextField.Root
                            id="username"
                            name="username"
                            autoFocus
                            autoComplete="username"
                            size="2"
                        />
                    </label>

                    <Button
                        type="submit"
                        size="3"
                        loading={isSubmitDisabled}
                        disabled={isSubmitDisabled}
                        style={{ width: "100%", cursor: isSubmitDisabled ? "not-allowed" : "pointer" }}
                    >
                        {i18n.msgStr("doSubmit")}
                    </Button>
                </Flex>
            </form>

            <Text as="p" align="center" mt="4" style={{ margin: "1rem 0 0" }}>
                <Text asChild size="2" style={{ color: "var(--color-nav, #004e89)" }}>
                    <a href={url.loginUrl}>{i18n.msg("backToLogin")}</a>
                </Text>
            </Text>
        </AuthCard>
    );
}
