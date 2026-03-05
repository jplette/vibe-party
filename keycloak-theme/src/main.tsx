import { createRoot } from "react-dom/client";
import { getKcContextMock } from "./login/KcContext";
import { KcPage } from "./login/KcPage";

// When running inside Keycloak, window.kcContext is injected by the FreeMarker template.
// During Vite dev, we use a mock context to render the UI locally.
const kcContext = (() => {
    if ((window as unknown as { kcContext?: unknown }).kcContext !== undefined) {
        return (window as unknown as { kcContext: Parameters<typeof KcPage>[0]["kcContext"] }).kcContext;
    }
    return getKcContextMock({
        pageId: "login.ftl",
        overrides: {}
    });
})();

createRoot(document.getElementById("root")!).render(
    <KcPage kcContext={kcContext} />
);
