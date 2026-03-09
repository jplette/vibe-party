import { useState } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import {
    Button,
    Callout,
    Flex,
    Switch,
    Text,
    TextField,
} from "@radix-ui/themes";
import { EyeClosedIcon, EyeOpenIcon } from "@radix-ui/react-icons";

type LoginKcContext = Extract<KcContext, { pageId: "login.ftl" }>;

interface Props {
    kcContext: LoginKcContext;
}

export default function Login({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });
    const { url, realm, login, social } = kcContext;
    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(login.rememberMe === "on");

    const usernameLabel = !realm.loginWithEmailAllowed
        ? i18n.msgStr("username")
        : !realm.registrationEmailAsUsername
        ? i18n.msgStr("usernameOrEmail")
        : i18n.msgStr("email");

    const messageColor = kcContext.message?.type === "error" ? "red" : "green";

    return (
        <AuthCard>
            <Logo />

            {kcContext.message && kcContext.message.type !== "warning" && (
                <Callout.Root color={messageColor} role="alert" mb="4">
                    <Callout.Text>{kcContext.message.summary}</Callout.Text>
                </Callout.Root>
            )}

            <form
                action={url.loginAction}
                method="post"
                onSubmit={() => setIsLoginButtonDisabled(true)}
            >
                <Flex direction="column" gap="4">
                    {/* Username / email field */}
                    <label>
                        <Text as="div" size="2" weight="bold" mb="1">
                            {usernameLabel}
                        </Text>
                        <TextField.Root
                            id="username"
                            name="username"
                            defaultValue={login.username ?? ""}
                            autoFocus
                            autoComplete="username"
                            size="2"
                        />
                    </label>

                    {/* Password field with show/hide toggle */}
                    <label>
                        <Text as="div" size="2" weight="bold" mb="1">
                            {i18n.msgStr("password")}
                        </Text>
                        <TextField.Root
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            size="2"
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
                    </label>

                    {/* Remember me + forgot password row */}
                    {(realm.rememberMe || realm.resetPasswordAllowed) && (
                        <Flex justify="between" align="center">
                            {realm.rememberMe ? (
                                <Flex align="center" gap="2">
                                    <Switch
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onCheckedChange={setRememberMe}
                                        size="1"
                                    />
                                    {/*
                                     * Switch doesn't submit a name/value in HTML POST.
                                     * A hidden input carries the rememberMe value to Keycloak.
                                     */}
                                    <input
                                        type="hidden"
                                        name="rememberMe"
                                        value={rememberMe ? "on" : ""}
                                    />
                                    <label htmlFor="rememberMe" style={{ cursor: "pointer" }}>
                                        <Text size="2">{i18n.msgStr("rememberMe")}</Text>
                                    </label>
                                </Flex>
                            ) : (
                                <span />
                            )}
                            {realm.resetPasswordAllowed && (
                                <Text asChild size="2">
                                    <a href={url.loginResetCredentialsUrl} style={{ color: "var(--color-nav, #004e89)" }}>
                                        {i18n.msgStr("doForgotPassword")}
                                    </a>
                                </Text>
                            )}
                        </Flex>
                    )}

                    {/* Submit */}
                    <Button
                        type="submit"
                        size="3"
                        loading={isLoginButtonDisabled}
                        disabled={isLoginButtonDisabled}
                        style={{ width: "100%", cursor: isLoginButtonDisabled ? "not-allowed" : "pointer" }}
                    >
                        {i18n.msgStr("doLogIn")}
                    </Button>

                    <input
                        type="hidden"
                        name="credentialId"
                        value={kcContext.auth?.selectedCredential ?? ""}
                    />
                </Flex>
            </form>

            {/* Register link */}
            {realm.password && realm.registrationAllowed && (
                <Text as="p" size="2" align="center" color="gray" mt="4" style={{ margin: "1rem 0 0" }}>
                    {i18n.msgStr("noAccount")}{" "}
                    <Text asChild weight="bold" style={{ color: "var(--accent-9)" }}>
                        <a href={url.registrationUrl}>{i18n.msgStr("doRegister")}</a>
                    </Text>
                </Text>
            )}

            {/* Social providers */}
            {social?.providers && social.providers.length > 0 && (
                <Flex direction="column" gap="2" mt="4">
                    <Text size="1" align="center" color="gray">or continue with</Text>
                    {social.providers.map(provider => (
                        <Button key={provider.providerId} asChild variant="outline" size="2">
                            <a href={provider.loginUrl}>{provider.displayName}</a>
                        </Button>
                    ))}
                </Flex>
            )}
        </AuthCard>
    );
}
