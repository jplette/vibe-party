import type { KcContext } from "keycloakify/login/KcContext";
import { useI18n } from "../i18n";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { Button, Callout, Flex, Text } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

type ErrorKcContext = Extract<KcContext, { pageId: "error.ftl" }>;

interface Props {
    kcContext: ErrorKcContext;
}

export default function Error({ kcContext }: Props) {
    const { i18n } = useI18n({ kcContext });

    return (
        <AuthCard>
            <Logo />
            <Flex direction="column" align="center" gap="3">
                {/* Warning icon bubble */}
                <div style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "50%",
                    background: "var(--red-3, #fff5f5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}>
                    <ExclamationTriangleIcon
                        width="22"
                        height="22"
                        style={{ color: "var(--red-9, #e5484d)" }}
                    />
                </div>

                <Text size="4" weight="bold" align="center" style={{ color: "var(--red-9, #e5484d)" }}>
                    {i18n.msgStr("errorTitle")}
                </Text>

                <Callout.Root color="red" role="alert" style={{ width: "100%" }}>
                    <Callout.Text>{kcContext.message.summary}</Callout.Text>
                </Callout.Root>

                {kcContext.client?.baseUrl && (
                    <Button
                        type="button"
                        size="3"
                        style={{ width: "100%" }}
                        onClick={() => { window.location.href = kcContext.client!.baseUrl!; }}
                    >
                        Back to application
                    </Button>
                )}
            </Flex>
        </AuthCard>
    );
}
