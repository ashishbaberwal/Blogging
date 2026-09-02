import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import authReducer from "../store/authSlice.js"

const service = vi.hoisted(() => ({
    getPost: vi.fn(),
    deletePost: vi.fn(),
    deleteFile: vi.fn(),
    getFilePreview: vi.fn(() => "preview-url"),
}))

vi.mock("../appwrite/config", () => ({ default: service }))
// appwrite/auth loads through components/index (LogoutBtn) and must not hit the real SDK
vi.mock("../appwrite/auth", () => ({
    default: { login: vi.fn(), createAccount: vi.fn(), getCurrentUser: vi.fn(), logout: vi.fn() },
}))

import Post from "./Post.jsx"

function renderPost({ userData = { $id: "author-1" }, post } = {}) {
    if (post !== undefined) service.getPost.mockResolvedValue(post)
    else
        service.getPost.mockResolvedValue({
            $id: "post-1",
            Title: "Hello World",
            Content: "<p>post body</p>",
            FeaturedImage: "img-1",
            UserId: "author-1",
        })

    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: { status: Boolean(userData), userData: userData ?? null } },
    })
    const router = createMemoryRouter(
        [
            { path: "/", element: <div>HOME</div> },
            { path: "/post/:slug", element: <Post /> },
        ],
        { initialEntries: ["/post/post-1"] }
    )
    return render(
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    )
}

describe("Post page", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("renders the post content and shows Edit/Delete to the author", async () => {
        renderPost()

        expect(await screen.findByRole("heading", { name: "Hello World" })).toBeInTheDocument()
        expect(screen.getByText("post body")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/edit-post/post-1")
        expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument()
    })

    it("hides Edit/Delete from readers who are not the author", async () => {
        renderPost({ userData: { $id: "someone-else" } })

        expect(await screen.findByRole("heading", { name: "Hello World" })).toBeInTheDocument()
        expect(screen.queryByRole("link", { name: "Edit" })).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument()
    })

    it("deletes the post, its featured image, and navigates home", async () => {
        const user = userEvent.setup()
        renderPost()
        service.deletePost.mockResolvedValue(true)

        await screen.findByRole("heading", { name: "Hello World" })
        await user.click(screen.getByRole("button", { name: "Delete" }))

        await waitFor(() => expect(service.deletePost).toHaveBeenCalledWith("post-1"))
        await waitFor(() => expect(service.deleteFile).toHaveBeenCalledWith("img-1"))
        expect(await screen.findByText("HOME")).toBeInTheDocument()
    })

    it("deletes the document only when it has no featured image", async () => {
        const user = userEvent.setup()
        renderPost({ post: { $id: "post-2", Title: "No Image", Content: "x", UserId: "author-1" } })
        service.deletePost.mockResolvedValue(true)

        await screen.findByRole("heading", { name: "No Image" })
        await user.click(screen.getByRole("button", { name: "Delete" }))

        await waitFor(() => expect(service.deletePost).toHaveBeenCalledWith("post-2"))
        expect(service.deleteFile).not.toHaveBeenCalled()
        expect(await screen.findByText("HOME")).toBeInTheDocument()
    })

    it("does nothing when deletion fails", async () => {
        const user = userEvent.setup()
        renderPost()
        service.deletePost.mockResolvedValue(false)

        await screen.findByRole("heading", { name: "Hello World" })
        await user.click(screen.getByRole("button", { name: "Delete" }))

        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(service.deleteFile).not.toHaveBeenCalled()
        expect(screen.queryByText("HOME")).not.toBeInTheDocument()
    })

    it("redirects home when the post cannot be loaded", async () => {
        service.getPost.mockResolvedValue(false)

        renderPost({ post: false })

        expect(await screen.findByText("HOME")).toBeInTheDocument()
        expect(service.getPost).toHaveBeenCalledWith("post-1")
    })
})
