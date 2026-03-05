import { createGetKcContextMock } from "keycloakify/login/KcContext";

export type { KcContext } from "keycloakify/login/KcContext";

export const { getKcContextMock } = createGetKcContextMock({
    kcContextExtension: {} as { properties?: Record<string, string | undefined> },
    kcContextExtensionPerPage: {} as Record<`${string}.ftl`, Record<string, unknown>>,
    overrides: {},
    overridesPerPage: {}
});
