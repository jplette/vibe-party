import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { Button, Flex, Text } from "@radix-ui/themes";
import { EnvelopeClosedIcon } from "@radix-ui/react-icons";

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
            <Flex direction="column" align="center" gap="3">
                {/* Email icon bubble */}
                <div style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "50%",
                    background: "var(--color-primary-lightest, #fff3ed)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <EnvelopeClosedIcon
                        width="22"
                        height="22"
                        style={{ color: "var(--accent-9, #ff6b35)" }}
                    />
                </div>

                <Text size="4" weight="bold" align="center" style={{ color: "var(--color-nav, #004e89)" }}>
                    {i18n.msgStr("emailVerifyTitle")}
                </Text>
                <Text size="2" align="center" color="gray" style={{ lineHeight: 1.6, maxWidth: "340px" }}>
                    {i18n.msgStr("emailVerifyInstruction1")}
                </Text>

                <form action={url.loginAction} method="post" style={{ width: "100%" }}>
                    <Button type="submit" size="3" style={{ width: "100%" }}>
                        {i18n.msgStr("doClickHere")}
                    </Button>
                </form>

                <Text size="1" align="center" color="gray">
                    {i18n.msgStr("emailVerifyInstruction2")}{" "}
                    <Text asChild weight="bold" style={{ color: "var(--accent-9)" }}>
                        <a href={url.loginAction}>{i18n.msgStr("doClickHere")}</a>
                    </Text>{" "}
                    {i18n.msgStr("emailVerifyInstruction3")}
                </Text>
            </Flex>
        </AuthCard>
    );
}
