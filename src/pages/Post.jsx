import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/config";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
    const [post, setPost] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const { slug } = useParams();
    const navigate = useNavigate();

    const userData = useSelector((state) => state.auth.userData);

    const isAuthor = post && userData ? post.UserId === userData.$id : false;

    useEffect(() => {
        if (slug) {
            appwriteService.getPost(slug).then((post) => {
                if (post) setPost(post);
                else navigate("/");
            });
        } else navigate("/");
    }, [slug, navigate]);

    const deletePost = () => {
        if (!window.confirm("Delete this post permanently? This action cannot be undone.")) {
            return;
        }
        setDeleting(true);
        setDeleteError("");
        appwriteService.deletePost(post.$id).then((Status) => {
            if (Status) {
                if (post.FeaturedImage) {
                    appwriteService.deleteFile(post.FeaturedImage);
                }
                navigate("/");
            } else {
                setDeleting(false);
                setDeleteError("Could not delete the post. Please try again.");
            }
        });
    };
    
    

    return post ? (
        <div className="py-8">
            <Container>
                <div className="w-full flex justify-center mb-4 relative border rounded-xl p-2">
                    {post.FeaturedImage && (
                        <img
                            src={appwriteService.getFilePreview(post.FeaturedImage)}
                            alt={post.Title}
                            className="rounded-xl"
                        />
                    )}

                    {isAuthor && (
                        <div className="absolute right-6 top-6">
                            <Link to={`/edit-post/${post.$id}`}>
                                <Button bgColor="bg-green-500" className="mr-3">
                                    Edit
                                </Button>
                            </Link>
                            <Button bgColor="bg-red-500" onClick={deletePost} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                            {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
                        </div>
                    )}
                </div>
                <div className="w-full mb-6">
                    <h1 className="text-2xl font-bold">{post.Title}</h1>
                </div>
                <div className="browser-css">
                    {parse(post.Content)}
                    </div>
            </Container>
        </div>
    ) : null;
}
