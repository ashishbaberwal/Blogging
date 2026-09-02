import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import authReducer from "../store/authSlice.js"
import AuthLayout from "./AuthLayout.jsx"

function renderProtected({ authentication = true, authStatus }) {
    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: { status: authStatus, userData: authStatus ? { $id: "user-1" } : null } },
    })
    const router = createMemoryRouter(
        [
            { path: "/", element: <div>HOME</div> },
            { path: "/login", element: <div>LOGIN</div> },
            {
                path: "/protected",
                element: (
                    <AuthLayout authentication={authentication}>
                        <div>SECRET</div>
                    </AuthLayout>
                ),
            },
        ],
        { initialEntries: ["/protected"] }
    )
    return render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    )
}

describe("AuthLayout", () => {
    it("lets authenticated users reach protected routes", async () => {
        renderProtected({ authentication: true, authStatus: true })

        expect(await screen.findByText("SECRET")).toBeInTheDocument()
    })

    it("redirects logged-out users away from protected routes", async () => {
        renderProtected({ authentication: true, authStatus: false })

        expect(await screen.findByText("LOGIN")).toBeInTheDocument()
        expect(screen.queryByText("SECRET")).not.toBeInTheDocument()
    })

    it("keeps authenticated users out of guest-only routes", async () => {
        renderProtected({ authentication: false, authStatus: true })

        expect(await screen.findByText("HOME")).toBeInTheDocument()
        expect(screen.queryByText("SECRET")).not.toBeInTheDocument()
    })

    it("lets logged-out users reach guest-only routes", async () => {
        renderProtected({ authentication: false, authStatus: false })

        expect(await screen.findByText("SECRET")).toBeInTheDocument()
    })
})
