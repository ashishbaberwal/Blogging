import React, { useEffect, useState } from "react";
import appwriteService from "../appwrite/config";
import { Container, PostCard } from "../components";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

function Home() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const authStatus = useSelector((state) => state.auth.status);

    useEffect(() => {
        appwriteService.getPosts().then((posts) => {
            if (posts) setPosts(posts.documents);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="w-full py-8 mt-4 text-center">
                <Container>
                    <h1 className="text-2xl font-bold text-gray-700">Loading posts...</h1>
                </Container>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="w-full py-8 mt-4 text-center">
                <Container>
                    <div className="flex flex-wrap">
                        <div className="p-2 w-full">
                            {authStatus ? (
                                <>
                                    <h1 className="text-2xl font-bold">No posts yet</h1>
                                    <Link
                                        to="/add-post"
                                        className="inline-block mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                                    >
                                        Write your first post
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold">Welcome to Chai Blog</h1>
                                    <p className="mt-2 text-gray-700">
                                        Sign in to read posts and share your own.
                                    </p>
                                    <Link
                                        to="/login"
                                        className="inline-block mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                                    >
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </Container>
            </div>
        );
    }
    return (
        <div className="w-full py-8">
            <Container>
                <div className="flex flex-wrap">
                    {posts.map((post) => (
                        <div key={post.$id} className="p-2 w-full sm:w-1/2 lg:w-1/4">
                            <PostCard {...post} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    );
}

export default Home;
