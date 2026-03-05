import { PrimeReactProvider } from "primereact/api";
import type { ReactNode } from "react";

// CSS load order matters — theme.css overrides must come last
import "primereact/resources/themes/lara-light-amber/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "../styles/theme.css";

interface Props {
    children: ReactNode;
}

export default function VibePartyProvider({ children }: Props) {
    return (
        <PrimeReactProvider value={{ ripple: true }}>
            {children}
        </PrimeReactProvider>
    );
}
