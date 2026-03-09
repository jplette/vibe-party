import type { KcContext } from "keycloakify/login/KcContext";
import AuthCard from "../../components/AuthCard";
import Logo from "../../components/Logo";
import { Code, Flex, Text } from "@radix-ui/themes";

interface Props {
    kcContext: KcContext;
}

/**
 * Minimal fallback for Keycloak pages we haven't custom-styled yet.
 * The page ID is shown so developers know which page needs implementation.
 */
export default function DefaultFallback({ kcContext }: Props) {
    return (
        <AuthCard>
            <Logo />
            <Flex direction="column" align="center" gap="2">
                <Text size="2" color="gray">
                    Page: <Code variant="soft">{kcContext.pageId}</Code>
                </Text>
                <Text size="1" color="gray">
                    This page has not been custom-styled yet. Add it to{" "}
                    <Code variant="ghost">src/login/KcPage.tsx</Code>.
                </Text>
            </Flex>
        </AuthCard>
    );
}
