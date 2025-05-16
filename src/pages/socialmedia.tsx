import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import { IoMdRefresh } from "react-icons/io";
import {
  getCurrentUser,
  createPost,
  fetchPosts,
  likePost,
  addComment,
  fetchComments,
  hasUserLikedPost,
  unlikePost,
  getPostLikesCount,
} from "../lib/supabase";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaRegComment, FaComment } from "react-icons/fa";

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url?: string;
  user?: {
    first_name?: string;
    last_name?: string;
  };
  comments?: {
    count: number;
  };
  likes_count?: number;
  comments_count?: number;
}

function SocialMedia() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  // Create post state
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [postLoading, setPostLoading] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentContent, setCommentContent] = useState<Record<string, string>>(
    {}
  );
  const [loadingComments, setLoadingComments] = useState<
    Record<string, boolean>
  >({});

  // Add a new state to track which posts the user has liked
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate("/");
          return;
        }
        setUserId(user.id);
        await refreshPosts();
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  const refreshPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserLikes = async () => {
      if (!userId) return;

      try {
        // Assuming you implemented the hasUserLikedPost function in supabase.ts
        const userLikedPosts: Record<string, boolean> = {};

        // For each post, check if the user has liked it
        for (const post of posts) {
          const hasLiked = await hasUserLikedPost(post.id);
          userLikedPosts[post.id] = hasLiked;
        }

        setUserLikes(userLikedPosts);
      } catch (error) {
        console.error("Error fetching user likes:", error);
      }
    };

    if (posts.length > 0 && userId) {
      fetchUserLikes();
    }
  }, [posts, userId]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || !userId) return;

    setPostLoading(true);
    try {
      await createPost(userId, postContent, postImage);
      setPostContent("");
      setPostImage(undefined);
      setImagePreview("");
      refreshPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setPostLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLike = async (postId: string) => {
    if (!userId) return;

    try {
      // Toggle like statusas
      const isCurrentlyLiked = userLikes[postId] || false;

      if (isCurrentlyLiked) {
        // Remove like if already liked
        await unlikePost(postId);

        // Update UI for like status
        setUserLikes((prev) => ({ ...prev, [postId]: false }));

        // Get the updated like count from the database
        const updatedLikesCount = await getPostLikesCount(postId);

        // Update the post with the new count
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, likes_count: updatedLikesCount }
              : post
          )
        );
      } else {
        // Add like if not already liked
        await likePost(postId);

        // Update UI for like status
        setUserLikes((prev) => ({ ...prev, [postId]: true }));

        // Get the updated like count from the database
        const updatedLikesCount = await getPostLikesCount(postId);

        // Update the post with the new count
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, likes_count: updatedLikesCount }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const toggleComments = async (postId: string) => {
    const isVisible = showComments[postId] || false;
    setShowComments((prev) => ({ ...prev, [postId]: !isVisible }));

    if (!isVisible && !comments[postId]) {
      setLoadingComments((prev) => ({ ...prev, [postId]: true }));
      try {
        const postComments = await fetchComments(postId);
        setComments((prev) => ({ ...prev, [postId]: postComments }));
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setLoadingComments((prev) => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!commentContent[postId]?.trim() || !userId) return;

    try {
      await addComment(postId, userId, commentContent[postId]);
      const updatedComments = await fetchComments(postId);
      setComments((prev) => ({ ...prev, [postId]: updatedComments }));
      setCommentContent((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <div className="bg-green-900 min-h-screen relative">
      <Header />
      <main className="pt-20 px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-gochi_hand font-bold text-white mb-6 flex items-center gap-3">
            Social Feed
            <IoMdRefresh
              className="text-2xl cursor-pointer"
              onClick={refreshPosts}
            />
          </h1>

          {/* Posts Feed */}
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <p className="text-gray-500">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <p className="text-gray-500">No posts yet.</p>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold mr-3">
                        {post.user?.first_name?.[0]}
                        {post.user?.last_name?.[0]}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {post.user?.first_name} {post.user?.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(post.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    <p className="mb-4">{post.content}</p>
                    {post.image_url && (
                      <div className="mb-4">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="rounded-lg max-h-96 w-auto mx-auto"
                        />
                      </div>
                    )}
                  </div>

                  {/* Post Interactions */}
                  <div className="px-4 py-2 border-t flex items-center justify-between text-gray-600">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 ${
                        userLikes[post.id]
                          ? "text-green-600"
                          : "hover:text-green-600"
                      }`}
                    >
                      {userLikes[post.id] ? (
                        <AiFillLike className="text-xl" />
                      ) : (
                        <AiOutlineLike className="text-xl" />
                      )}
                      <span>{post.likes_count || 0}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex items-center gap-1 ${
                        showComments[post.id]
                          ? "text-green-600"
                          : "hover:text-green-600"
                      }`}
                    >
                      {showComments[post.id] ? (
                        <FaComment className="text-xl" />
                      ) : (
                        <FaRegComment className="text-xl" />
                      )}
                      <span>{post.comments_count || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {showComments[post.id] && (
                    <div className="p-4 bg-gray-50 border-t">
                      {loadingComments[post.id] ? (
                        <p className="text-center text-gray-500 py-2">
                          Loading comments...
                        </p>
                      ) : (
                        <>
                          <div className="mb-4 max-h-60 overflow-y-auto">
                            {comments[post.id]?.length === 0 ? (
                              <p className="text-center text-gray-500 py-2">
                                No comments yet.
                              </p>
                            ) : (
                              comments[post.id]?.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="p-2 border-b last:border-0"
                                >
                                  <div className="flex items-center mb-1">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold text-xs mr-2">
                                      {comment.user?.first_name?.[0]}
                                      {comment.user?.last_name?.[0]}
                                    </div>
                                    <div>
                                      <span className="font-medium text-sm">
                                        {comment.user?.first_name}{" "}
                                        {comment.user?.last_name}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        {new Date(
                                          comment.created_at
                                        ).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="ml-8 text-sm">
                                    {comment.content}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Add Comment Form */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              placeholder="Write a comment..."
                              value={commentContent[post.id] || ""}
                              onChange={(e) =>
                                setCommentContent((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              onClick={() => handleCommentSubmit(post.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                              disabled={!commentContent[post.id]?.trim()}
                            >
                              Post
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Floating Create Post Button with animation */}
      <button
        onClick={() => setShowCreatePostModal(true)}
        className="fixed right-8 bottom-8 bg-green-600 hover:bg-green-700 text-white px-4 font-poppins h-14 rounded-full shadow-lg flex gap-2 items-center justify-center transition-all duration-300 hover:scale-110 "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <p>New Post</p>
      </button>

      {/* Create Post Modal */}
      {showCreatePostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-green-900">
                  Create Post
                </h2>
                <button
                  onClick={() => setShowCreatePostModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  handlePostSubmit(e);
                  setShowCreatePostModal(false);
                }}
              >
                <textarea
                  className="w-full border rounded-lg p-3 mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={3}
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Image (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePostModal(false)}
                    className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                    disabled={postLoading || !postContent.trim()}
                  >
                    {postLoading ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialMedia;
