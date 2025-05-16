import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import {
  getCurrentUser,
  fetchUserProfile,
  updateUserProfile,
  fetchUserPosts,
  deletePost,
  uploadProfileImage,
  hasUserLikedPost,
} from "../lib/supabase";
import { FiEdit2, FiCamera } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaRegComment, FaComment } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  photo_url?: string;
  location?: string;
  phone?: string;
  created_at?: string;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  image_url?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    photo_url?: string;
  };
  likes_count?: number;
  comments_count?: number;
}

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Initialize page
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const user = await getCurrentUser();
        if (!user) {
          navigate("/");
          return;
        }
        console.log("User ID:", user);
        const profileData = await fetchUserProfile(user.id);
        setUserProfile(profileData);
        setEditedProfile(profileData);

        // Fetch user's posts using user.id since userProfile isn't set yet
        loadUserPosts(user.id);
      } catch (error) {
        console.error("Error initializing profile:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  // Rename this function from fetchUserPosts to loadUserPosts
  const loadUserPosts = async (userId: string) => {
    setPostsLoading(true);
    try {
      const userPosts = await fetchUserPosts(userId);
      setPosts(userPosts);

      // Check which posts the user has liked
      const userLikedPosts: Record<string, boolean> = {};
      for (const post of userPosts) {
        const hasLiked = await hasUserLikedPost(post.id);
        userLikedPosts[post.id] = hasLiked;
      }
      setUserLikes(userLikedPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setPostsLoading(false);
    }
  };

  // Handle profile image change
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
    }
  };

  // Handle save profile changes
  const handleSaveProfile = async () => {
    if (!editedProfile) return;

    setLoading(true);
    try {
      let photoUrl = editedProfile.photo_url; // Changed from avatarUrl to photoUrl

      // Upload profile image if changed
      if (profileImage) {
        photoUrl = await uploadProfileImage(
          editedProfile.user_id,
          profileImage
        );
      }

      // Update profile with new data
      const updatedProfile = {
        ...editedProfile,
        photo_url: photoUrl,
      };
      console.log("Updated Profile:", updatedProfile);
      await updateUserProfile(updatedProfile);
      setUserProfile(updatedProfile);
      setIsEditing(false);
      setProfileImage(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete post
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId: string) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  if (loading) {
    return (
      <div className="bg-green-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-2xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="bg-green-900 min-h-screen relative">
      <Header />

      <main className="pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            {/* Cover Photo Section */}
            <div className="h-48 bg-green-200 relative">
              {isEditing && <div className="absolute bottom-4 right-4"></div>}
            </div>

            {/* Profile Info Section */}
            <div className="px-6 pt-0 pb-6 relative">
              {/* Profile Picture */}
              <div className="absolute -top-16 left-6">
                <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-300">
                  {userProfile?.photo_url ? (
                    <img
                      src={
                        profileImage
                          ? URL.createObjectURL(profileImage)
                          : userProfile.photo_url
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-5xl">
                      <FiCamera />
                    </div>
                  )}
                </div>
              </div>

              {/* Edit/Save Button */}
              <div className="flex justify-end mt-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProfile(userProfile);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                    <label className="bg-white p-2 rounded-full cursor-pointer shadow-md">
                      <FiCamera className="text-green-700 text-xl" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </label>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FiEdit2 /> Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Details */}
              <div className="mt-16">
                {isEditing ? (
                  /* Editable Profile Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={editedProfile?.first_name || ""}
                          onChange={(e) =>
                            setEditedProfile((prev) =>
                              prev
                                ? { ...prev, first_name: e.target.value }
                                : null
                            )
                          }
                          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={editedProfile?.last_name || ""}
                          onChange={(e) =>
                            setEditedProfile((prev) =>
                              prev
                                ? { ...prev, last_name: e.target.value }
                                : null
                            )
                          }
                          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={editedProfile?.location || ""}
                          onChange={(e) =>
                            setEditedProfile((prev) =>
                              prev
                                ? { ...prev, location: e.target.value }
                                : null
                            )
                          }
                          className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editedProfile?.phone || ""}
                        onChange={(e) =>
                          setEditedProfile((prev) =>
                            prev ? { ...prev, phone: e.target.value } : null
                          )
                        }
                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Display Profile */
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </h1>

                    <div className="mt-4 space-y-2 text-gray-700">
                      {userProfile?.email && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span>{userProfile.email}</span>
                        </div>
                      )}

                      {userProfile?.location && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Location:</span>
                          <span>{userProfile.location}</span>
                        </div>
                      )}

                      {userProfile?.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Phone:</span>
                          <span>{userProfile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Posts Section */}
          <h2 className="text-2xl font-bold text-white mb-4">Your Posts</h2>

          <div className="space-y-6">
            {postsLoading ? (
              <div className="bg-white rounded-lg p-4 text-center">
                Loading your posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  You haven't created any posts yet.
                </p>
                <button
                  onClick={() => navigate("/socialmedia")}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4 flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
                        {userProfile?.photo_url ? (
                          <img
                            src={userProfile.photo_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {userProfile?.first_name} {userProfile?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {post.created_at &&
                            formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                            })}
                        </p>
                      </div>
                    </div>

                    {/* Delete Post Button */}
                    <div className="relative">
                      <button
                        onClick={() => setDeleteConfirm(post.id)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        <RiDeleteBinLine className="text-xl" />
                      </button>

                      {/* Delete Confirmation Popup */}
                      {deleteConfirm === post.id && (
                        <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3 w-64">
                          <p className="text-sm mb-2">
                            Are you sure you want to delete this post?
                          </p>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 py-2">
                    <p className="whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Post Image (if any) */}
                  {post.image_url && (
                    <div className="mt-2">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full h-auto"
                      />
                    </div>
                  )}

                  {/* Post Interactions */}
                  <div className="px-4 py-2 border-t flex items-center justify-between text-gray-600">
                    <button
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
                    <div className="p-4 border-t">
                      <p className="text-center text-gray-500">
                        View this post on the Social Feed to see comments
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
