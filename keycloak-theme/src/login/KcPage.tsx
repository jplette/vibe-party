import { Suspense, lazy } from "react";
import type { KcContext } from "keycloakify/login/KcContext";
import VibePartyProvider from "../components/VibePartyProvider";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const LoginResetPassword = lazy(() => import("./pages/LoginResetPassword"));
const LoginVerifyEmail = lazy(() => import("./pages/LoginVerifyEmail"));
const ErrorPage = lazy(() => import("./pages/Error"));

// Pages we haven't custom-styled fall back to a minimal wrapper
const DefaultFallback = lazy(() => import("./pages/DefaultFallback"));

interface KcPageProps {
    kcContext: KcContext;
}

export function KcPage({ kcContext }: KcPageProps) {
    return (
        <VibePartyProvider>
            <Suspense fallback={
                <div style={{ display: "flex", justifyContent: "center", padding: "4rem", fontFamily: "Lato, sans-serif" }}>
                    Loading...
                </div>
            }>
                <KcPageSwitch kcContext={kcContext} />
            </Suspense>
        </VibePartyProvider>
    );
}

function KcPageSwitch({ kcContext }: KcPageProps) {
    switch (kcContext.pageId) {
        case "login.ftl":
            return <Login kcContext={kcContext} />;
        case "register.ftl":
            return <Register kcContext={kcContext} />;
        case "login-reset-password.ftl":
            return <LoginResetPassword kcContext={kcContext} />;
        case "login-verify-email.ftl":
            return <LoginVerifyEmail kcContext={kcContext} />;
        case "error.ftl":
            return <ErrorPage kcContext={kcContext} />;
        default:
            return <DefaultFallback kcContext={kcContext} />;
    }
}
