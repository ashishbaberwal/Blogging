import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const sdk = vi.hoisted(() => {
    const mockAccount = {
        create: vi.fn(),
        createEmailPasswordSession: vi.fn(),
        get: vi.fn(),
        deleteSessions: vi.fn(),
    }
    const stash = { clientCalls: [] }
    const mockClient = vi.fn(function () {
        const instance = {
            setEndpoint: vi.fn(function (value) {
                stash.clientCalls.push(["endpoint", value])
                return instance
            }),
            setProject: vi.fn(function (value) {
                stash.clientCalls.push(["project", value])
                return instance
            }),
        }
        return instance
    })
    return { mockClient, mockAccount, stash }
})

vi.mock("appwrite", () => ({
    Client: sdk.mockClient,
    Account: vi.fn(function () {
        return sdk.mockAccount
    }),
    ID: { unique: vi.fn(() => "generated-id") },
}))

import conf from "../conf/conf.js"
import authService from "./auth.js"

describe("AuthService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("configures the client with the appwrite endpoint and project", () => {
        expect(sdk.stash.clientCalls).toEqual([
            ["endpoint", conf.appwriteEndpoint],
            ["project", conf.appwriteProjectId],
        ])
    })

    it("creates an account and logs the user in with the same credentials", async () => {
        const userAccount = { $id: "user-1" }
        const session = { $id: "session-1" }
        sdk.mockAccount.create.mockResolvedValue(userAccount)
        sdk.mockAccount.createEmailPasswordSession.mockResolvedValue(session)

        const result = await authService.createAccount({
            email: "a@b.com",
            password: "secret",
            name: "Ada",
        })

        expect(sdk.mockAccount.create).toHaveBeenCalledWith("generated-id", "a@b.com", "secret", "Ada")
        expect(sdk.mockAccount.createEmailPasswordSession).toHaveBeenCalledWith("a@b.com", "secret")
        expect(result).toBe(session)
    })

    it("rethrows account creation errors and never logs in", async () => {
        const error = new Error("user already registered")
        sdk.mockAccount.create.mockRejectedValue(error)

        await expect(
            authService.createAccount({ email: "a@b.com", password: "secret", name: "Ada" })
        ).rejects.toThrow("user already registered")

        expect(sdk.mockAccount.createEmailPasswordSession).not.toHaveBeenCalled()
    })

    it("returns the session from login", async () => {
        const session = { $id: "session-1" }
        sdk.mockAccount.createEmailPasswordSession.mockResolvedValue(session)

        await expect(authService.login({ email: "a@b.com", password: "secret" })).resolves.toBe(session)
    })

    it("returns the current user", async () => {
        const user = { $id: "user-1" }
        sdk.mockAccount.get.mockResolvedValue(user)

        await expect(authService.getCurrentUser()).resolves.toBe(user)
    })

    it("returns null instead of throwing when the session is missing", async () => {
        sdk.mockAccount.get.mockRejectedValue(new Error("missing session"))

        await expect(authService.getCurrentUser()).resolves.toBeNull()
    })

    it("resolves logout even when session deletion fails", async () => {
        sdk.mockAccount.deleteSessions.mockRejectedValue(new Error("network"))

        await expect(authService.logout()).resolves.toBeUndefined()
    })
})
