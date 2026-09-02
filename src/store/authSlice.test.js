import { describe, it, expect } from "vitest"
import reducer, { login, logout } from "./authSlice.js"

describe("authSlice", () => {
    it("starts logged out with no user data", () => {
        expect(reducer(undefined, { type: "unknown" })).toEqual({ status: false, userData: null })
    })

    it("marks the user logged in with their data", () => {
        const state = reducer(undefined, login({ userData: { $id: "user-1", name: "Ada" } }))
        expect(state).toEqual({ status: true, userData: { $id: "user-1", name: "Ada" } })
    })

    it("clears user data on logout", () => {
        const loggedIn = { status: true, userData: { $id: "user-1" } }
        expect(reducer(loggedIn, logout())).toEqual({ status: false, userData: null })
    })
})
