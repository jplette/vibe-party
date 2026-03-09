import type { ReactNode } from "react";
import { Theme } from "@radix-ui/themes";

// Radix base styles must come first so our brand token overrides win
import "@radix-ui/themes/styles.css";
import "../styles/theme.css";

interface Props {
    children: ReactNode;
}

export default function VibePartyProvider({ children }: Props) {
    return (
        <Theme accentColor="orange" grayColor="slate" radius="medium">
            {children}
        </Theme>
    );
}
