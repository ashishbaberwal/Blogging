import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "../index";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";


export default function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.Title || "",
            slug: post?.$id || "",
            content: post?.Content || "",
            status: post?.Status || "active",
        },
    });

    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async (data) => {
        setError("");
        setSubmitting(true);

        try {
            if (post) {
                const file = data.image?.[0] ? await appwriteService.uploadFile(data.image[0]) : null;

                if (file && post.FeaturedImage) {
                    await appwriteService.deleteFile(post.FeaturedImage);
                }

                const dbPost = await appwriteService.updatePost(post.$id, {
                    title: data.title,
                    content: data.content,
                    status: data.status,
                    featuredImage: file ? file.$id : post.FeaturedImage,
                });

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                    return;
                }

                setError("Post update failed. Check Appwrite permissions and try again.");
            } else {
                if (!userData?.$id) {
                    setError("You need to be logged in to create a post.");
                    return;
                }

                const file = await appwriteService.uploadFile(data.image?.[0]);

                if (!file) {
                    setError("Image upload failed. Check your Appwrite bucket settings.");
                    return;
                }

                const createPayload = {
                    title: data.title,
                    slug: data.slug,
                    content: data.content,
                    status: data.status,
                    featuredImage: file.$id,
                    userId: userData.$id,
                };

                let dbPost = await appwriteService.createPost(createPayload);

                if (!dbPost) {
                    dbPost = await appwriteService.createPost({
                        ...createPayload,
                        slug: `${data.slug}-${Date.now()}`,
                    });
                }

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                    return;
                }

                setError("Post creation failed. The slug may already exist or your Appwrite permissions may be blocking writes.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string")
            return value
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z\d\s]+/g, "-")
                .replace(/\s/g, "-");

        return "";
    }, []);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
            <div className="w-2/3 px-2">
                <Input
                    label="Title :"
                    placeholder="Title"
                    className="mb-4"
                    {...register("title", { required: true })}
                />
                <Input
                    label="Slug :"
                    placeholder="Slug"
                    className="mb-4"
                    {...register("slug", { required: true })}
                    onInput={(e) => {
                        setValue("slug", slugTransform(e.currentTarget.value), { shouldValidate: true });
                    }}
                />
                <RTE label="Content :" name="content" control={control} defaultValue={getValues("content")} />
            </div>
            <div className="w-1/3 px-2">
                <Input
                    label="Featured Image :"
                    type="file"
                    id="uploader"
                    className="mb-4"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    {...register("image", { required: !post })}
                />
                {post && (
                    <div className="w-full mb-4">
                        <img
                            src={appwriteService.getFilePreview(post.FeaturedImage)}
                            alt={post.title}
                            className="rounded-lg"
                        />
                    </div>
                )}
                <Select
                    options={["active", "inactive"]}
                    label="Status"
                    className="mb-4"
                    {...register("status", { required: true })}
                />
                <Button
                    type="submit"
                    bgColor={post ? "bg-green-500" : undefined}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={submitting}
                >
                    {submitting ? "Saving..." : post ? "Update" : "Submit"}
                </Button>
                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </div>
        </form>
    );
}
