import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import authReducer from "../../store/authSlice.js"

const service = vi.hoisted(() => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
    updatePost: vi.fn(),
    createPost: vi.fn(),
    getFilePreview: vi.fn(() => "preview-url"),
}))

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock("../../appwrite/config", () => ({ default: service }))
// appwrite/auth loads through components/index (LogoutBtn) and must not hit the real SDK
vi.mock("../../appwrite/auth", () => ({
    default: { login: vi.fn(), createAccount: vi.fn(), getCurrentUser: vi.fn(), logout: vi.fn() },
}))
// TinyMCE is not available in jsdom; register the field through the form control instead
vi.mock("../RTE", async () => {
    const { Controller } = await import("react-hook-form")
    return {
        default: ({ name, control, defaultValue = "" }) => (
            <Controller
                name={name || "content"}
                control={control}
                render={({ field: { onChange } }) => (
                    <textarea
                        aria-label={name || "content"}
                        defaultValue={defaultValue}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )}
            />
        ),
    }
})
vi.mock("react-router-dom", async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, useNavigate: () => navigateMock }
})

import PostForm from "./PostForm.jsx"

const image = new File(["pixels"], "p.png", { type: "image/png" })

function renderPostForm(post, { userData } = {}) {
    const store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: { status: Boolean(userData), userData: userData ?? null } },
    })
    return render(<PostForm post={post} />, {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    })
}

describe("PostForm", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("turns the title into a slug as the user types", async () => {
        const user = userEvent.setup()
        renderPostForm()

        await user.type(screen.getByLabelText("Title :"), "Hello, World! 123")

        expect(screen.getByLabelText("Slug :")).toHaveValue("hello--world--123")
    })

    it("blocks post creation for logged-out users without uploading anything", async () => {
        const user = userEvent.setup()
        renderPostForm(undefined, { userData: null })

        await user.type(screen.getByLabelText("Title :"), "My Post")
        await user.upload(screen.getByLabelText("Featured Image :"), image)
        await user.click(screen.getByRole("button", { name: "Submit" }))

        expect(await screen.findByText("You need to be logged in to create a post.")).toBeInTheDocument()
        expect(service.uploadFile).not.toHaveBeenCalled()
        expect(service.createPost).not.toHaveBeenCalled()
        expect(navigateMock).not.toHaveBeenCalled()
    })

    it("uploads the featured image and navigates to the new post", async () => {
        const user = userEvent.setup()
        renderPostForm(undefined, { userData: { $id: "user-1" } })
        service.uploadFile.mockResolvedValue({ $id: "img-1" })
        service.createPost.mockResolvedValue({ $id: "hello--world--123" })

        await user.type(screen.getByLabelText("Title :"), "Hello, World! 123")
        await user.upload(screen.getByLabelText("Featured Image :"), image)
        await user.click(screen.getByRole("button", { name: "Submit" }))

        await waitFor(() => expect(service.createPost).toHaveBeenCalledTimes(1))
        expect(service.createPost).toHaveBeenCalledWith({
            title: "Hello, World! 123",
            slug: "hello--world--123",
            content: "",
            status: "active",
            featuredImage: "img-1",
            userId: "user-1",
        })
        expect(service.uploadFile).toHaveBeenCalledOnce()
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/post/hello--world--123"))
    })

    it("retries with a unique slug when the original one collides", async () => {
        const user = userEvent.setup()
        renderPostForm(undefined, { userData: { $id: "user-1" } })
        service.uploadFile.mockResolvedValue({ $id: "img-1" })
        service.createPost.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ $id: "retried-id" })

        await user.type(screen.getByLabelText("Title :"), "My Post")
        await user.upload(screen.getByLabelText("Featured Image :"), image)
        await user.click(screen.getByRole("button", { name: "Submit" }))

        await waitFor(() => expect(service.createPost).toHaveBeenCalledTimes(2))
        expect(service.createPost.mock.calls[1][0].slug).toMatch(/^my-post-\d+$/)
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/post/retried-id"))
    })

    it("shows a bucket error and does not navigate when the image upload fails", async () => {
        const user = userEvent.setup()
        renderPostForm(undefined, { userData: { $id: "user-1" } })
        service.uploadFile.mockResolvedValue(false)

        await user.type(screen.getByLabelText("Title :"), "My Post")
        await user.upload(screen.getByLabelText("Featured Image :"), image)
        await user.click(screen.getByRole("button", { name: "Submit" }))

        expect(
            await screen.findByText("Image upload failed. Check your Appwrite bucket settings.")
        ).toBeInTheDocument()
        expect(service.createPost).not.toHaveBeenCalled()
        expect(navigateMock).not.toHaveBeenCalled()
    })

    it("keeps the existing featured image when editing without a new upload", async () => {
        const user = userEvent.setup()
        renderPostForm(
            { $id: "post-1", Title: "Old Title", Content: "<p>old</p>", Status: "active", FeaturedImage: "img-old" },
            { userData: { $id: "user-1" } }
        )
        service.updatePost.mockResolvedValue({ $id: "post-1" })

        await user.click(screen.getByRole("button", { name: "Update" }))

        await waitFor(() =>
            expect(service.updatePost).toHaveBeenCalledWith("post-1", {
                title: "Old Title",
                content: "<p>old</p>",
                status: "active",
                featuredImage: "img-old",
            })
        )
        expect(service.uploadFile).not.toHaveBeenCalled()
        expect(service.deleteFile).not.toHaveBeenCalled()
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/post/post-1"))
    })

    it("replaces the featured image and deletes the old one when editing with a new upload", async () => {
        const user = userEvent.setup()
        renderPostForm(
            { $id: "post-1", Title: "Old Title", Content: "<p>old</p>", Status: "active", FeaturedImage: "img-old" },
            { userData: { $id: "user-1" } }
        )
        service.uploadFile.mockResolvedValue({ $id: "img-new" })
        service.updatePost.mockResolvedValue({ $id: "post-1" })

        await user.upload(screen.getByLabelText("Featured Image :"), image)
        await user.click(screen.getByRole("button", { name: "Update" }))

        await waitFor(() => expect(service.deleteFile).toHaveBeenCalledWith("img-old"))
        expect(service.updatePost).toHaveBeenCalledWith("post-1", expect.objectContaining({ featuredImage: "img-new" }))
        await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/post/post-1"))
    })
})
