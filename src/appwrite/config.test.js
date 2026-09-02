import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const sdk = vi.hoisted(() => {
    const mockDatabases = {
        createDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
        getDocument: vi.fn(),
        listDocuments: vi.fn(),
    }
    const mockStorage = {
        createFile: vi.fn(),
        deleteFile: vi.fn(),
        getFilePreview: vi.fn(),
    }
    return {
        mockClient: vi.fn(function () {
            return {
                setEndpoint: vi.fn().mockReturnThis(),
                setProject: vi.fn().mockReturnThis(),
            }
        }),
        mockDatabases,
        mockStorage,
    }
})

vi.mock("appwrite", () => ({
    Client: sdk.mockClient,
    Databases: vi.fn(function () {
        return sdk.mockDatabases
    }),
    Storage: vi.fn(function () {
        return sdk.mockStorage
    }),
    ID: { unique: vi.fn(() => "generated-file-id") },
    Query: { equal: vi.fn((field, value) => ({ field, value })) },
}))

import conf from "../conf/conf.js"
import service from "./config.js"

describe("Service (posts + files)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, "log").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("creates a post using the slug as the document id", async () => {
        const created = { $id: "my-post", Title: "My Post" }
        sdk.mockDatabases.createDocument.mockResolvedValue(created)

        const result = await service.createPost({
            title: "My Post",
            slug: "my-post",
            content: "<p>hi</p>",
            featuredImage: "file-1",
            status: "active",
            userId: "user-1",
        })

        expect(sdk.mockDatabases.createDocument).toHaveBeenCalledWith(
            conf.appwriteDataBaseId,
            conf.appwriteCollectionId,
            "my-post",
            {
                Title: "My Post",
                Content: "<p>hi</p>",
                FeaturedImage: "file-1",
                Status: "active",
                UserId: "user-1",
            }
        )
        expect(result).toBe(created)
    })

    it("returns undefined (no throw) when document creation fails", async () => {
        sdk.mockDatabases.createDocument.mockRejectedValue(new Error("permission denied"))

        const result = await service.createPost({
            title: "T",
            slug: "t",
            content: "c",
            featuredImage: "f",
            status: "active",
            userId: "u",
        })

        expect(result).toBeUndefined()
    })

    it("updates a post without overwriting authorship fields", async () => {
        sdk.mockDatabases.updateDocument.mockResolvedValue({ $id: "my-post" })

        await service.updatePost("my-post", {
            title: "New Title",
            content: "<p>new</p>",
            featuredImage: "file-2",
            status: "inactive",
        })

        expect(sdk.mockDatabases.updateDocument).toHaveBeenCalledWith(
            conf.appwriteDataBaseId,
            conf.appwriteCollectionId,
            "my-post",
            { Title: "New Title", Content: "<p>new</p>", FeaturedImage: "file-2", Status: "inactive" }
        )
    })

    it("returns true on successful delete and false on failure", async () => {
        sdk.mockDatabases.deleteDocument.mockResolvedValue(undefined)
        await expect(service.deletePost("my-post")).resolves.toBe(true)

        sdk.mockDatabases.deleteDocument.mockRejectedValue(new Error("not found"))
        await expect(service.deletePost("missing")).resolves.toBe(false)
    })

    it("returns the post document", async () => {
        const doc = { $id: "my-post" }
        sdk.mockDatabases.getDocument.mockResolvedValue(doc)
        await expect(service.getPost("my-post")).resolves.toBe(doc)
    })

    it("returns false instead of throwing when a post cannot be loaded", async () => {
        sdk.mockDatabases.getDocument.mockRejectedValue(new Error("not found"))
        await expect(service.getPost("missing")).resolves.toBe(false)
    })

    it("defaults to active-status queries when none are provided", async () => {
        sdk.mockDatabases.listDocuments.mockResolvedValue({ documents: [] })

        await service.getPosts()

        expect(sdk.mockDatabases.listDocuments).toHaveBeenCalledWith(
            conf.appwriteDataBaseId,
            conf.appwriteCollectionId,
            [{ field: "Status", value: "active" }]
        )
    })

    it("passes through custom queries to listDocuments", async () => {
        sdk.mockDatabases.listDocuments.mockResolvedValue({ documents: [] })
        const custom = [{ field: "UserId", value: "user-1" }]

        await service.getPosts(custom)

        expect(sdk.mockDatabases.listDocuments).toHaveBeenCalledWith(
            conf.appwriteDataBaseId,
            conf.appwriteCollectionId,
            custom
        )
    })

    it("returns the uploaded file and false on upload failure", async () => {
        const file = { $id: "uploaded", name: "p.png" }
        sdk.mockStorage.createFile.mockResolvedValue(file)
        await expect(service.uploadFile(file)).resolves.toBe(file)

        sdk.mockStorage.createFile.mockRejectedValue(new Error("bucket full"))
        await expect(service.uploadFile(file)).resolves.toBe(false)
    })

    it("returns true on successful file delete and false on failure", async () => {
        sdk.mockStorage.deleteFile.mockResolvedValue(undefined)
        await expect(service.deleteFile("file-1")).resolves.toBe(true)

        sdk.mockStorage.deleteFile.mockRejectedValue(new Error("not found"))
        await expect(service.deleteFile("missing")).resolves.toBe(false)
    })

    it("requests a 248x248 preview", () => {
        sdk.mockStorage.getFilePreview.mockReturnValue("preview-url")

        const result = service.getFilePreview("file-1")

        expect(sdk.mockStorage.getFilePreview).toHaveBeenCalledWith(conf.appwriteBucketId, "file-1", 248, 248)
        expect(result).toBe("preview-url")
    })
})
