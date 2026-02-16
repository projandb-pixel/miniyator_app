"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import SupplierNavigation from "@/components/supplier/SupplierNavigation";
import { getPetrochemicalLogo, isPetrochemicalCompany } from "@/lib/petrochemical-logos";

interface Post {
  id: string;
  companyId: string;
  company: {
    id: string;
    name: string;
    logo: string | null;
    isVerified: boolean;
  };
  content: string | null;
  imageUrl: string | null;
  tenderId: string | null;
  likes: number;
  comments: number;
  views: number;
  userLiked: boolean;
  createdAt: string;
}

export default function SupplierExplore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchUserCompany(storedUserId);
      fetchPosts(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserCompany = async (userId: string) => {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      const data = await response.json();
      if (data.user && data.user.company) {
        setUserCompanyId(data.user.company.id);
      }
    } catch (error) {
      console.error("Error fetching user company:", error);
    }
  };

  // ثبت بازدید هنگام نمایش پست
  useEffect(() => {
    if (userId && posts.length > 0) {
      const viewedPostIds = new Set<string>();
      posts.forEach((post, index) => {
        // ثبت بازدید با تاخیر برای جلوگیری از درخواست‌های زیاد
        setTimeout(() => {
          if (!viewedPostIds.has(post.id)) {
            viewedPostIds.add(post.id);
            fetch(`/api/posts/${post.id}/view`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.views !== undefined) {
                  setPosts((prevPosts) =>
                    prevPosts.map((p) =>
                      p.id === post.id ? { ...p, views: data.views } : p
                    )
                  );
                }
              })
              .catch((error) => {
                console.error("Error recording view:", error);
              });
          }
        }, index * 500); // تاخیر بین هر درخواست
      });
    }
  }, [posts.length, userId]); // فقط وقتی تعداد پست‌ها تغییر کند

  const fetchPosts = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Posts fetched:", data.posts?.map((p: any) => ({ 
          id: p.id, 
          hasImage: !!p.imageUrl,
          imageUrlLength: p.imageUrl ? p.imageUrl.length : 0,
          imageUrlPreview: p.imageUrl ? p.imageUrl.substring(0, 50) : null,
        })));
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!userId) return;

    if (!newPostContent && !newPostImage) {
      alert("لطفاً متن یا تصویر را وارد کنید");
      return;
    }

    console.log("Creating post with:", {
      userId,
      hasContent: !!newPostContent,
      contentLength: newPostContent.length,
      hasImage: !!newPostImage,
      imageLength: newPostImage ? newPostImage.length : 0,
      imagePreview: newPostImage ? newPostImage.substring(0, 100) : null,
    });

    try {
      setPosting(true);
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          content: newPostContent,
          image: newPostImage,
        }),
      });

      const data = await response.json();
      console.log("Post creation response:", {
        ok: response.ok,
        hasPost: !!data.post,
        hasImageUrl: !!data.post?.imageUrl,
        imageUrlLength: data.post?.imageUrl ? data.post.imageUrl.length : 0,
      });

      if (response.ok) {
        setPosts([data.post, ...posts]);
        setShowCreateModal(false);
        setNewPostContent("");
        setNewPostImage(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        console.error("Error creating post:", data);
        alert(data.error || "خطا در ایجاد پست");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("خطا در ایجاد پست");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  userLiked: data.liked,
                  likes:
                    data.likes !== undefined
                      ? data.likes
                      : data.liked
                      ? post.likes + 1
                      : Math.max(0, post.likes - 1),
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleShowComments = async (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!userId) {
      alert("لطفاً ابتدا وارد شوید");
      return;
    }

    if (!selectedPost) {
      alert("لطفاً ابتدا یک پست را انتخاب کنید");
      return;
    }

    if (!newComment.trim()) {
      alert("لطفاً متن کامنت را وارد کنید");
      return;
    }

    const commentContent = newComment.trim();
    setNewComment(""); // پاک کردن فیلد قبل از ارسال

    try {
      const response = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          content: commentContent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setComments([...comments, data.comment]);
        setPosts(
          posts.map((post) =>
            post.id === selectedPost.id
              ? { ...post, comments: post.comments + 1 }
              : post
          )
        );
      } else {
        console.error("Error adding comment:", data);
        alert(data.error || "خطا در افزودن کامنت");
        setNewComment(commentContent); // برگرداندن متن در صورت خطا
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("خطا در افزودن کامنت. لطفاً دوباره تلاش کنید.");
      setNewComment(commentContent); // برگرداندن متن در صورت خطا
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file ? { name: file.name, size: file.size, type: file.type } : "No file");
    
    if (file) {
      // بررسی اندازه فایل (حداکثر 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم فایل نباید بیشتر از 5 مگابایت باشد");
        e.target.value = ""; // پاک کردن انتخاب
        return;
      }
      // بررسی نوع فایل
      if (!file.type.startsWith("image/")) {
        alert("لطفاً فقط فایل تصویری انتخاب کنید");
        e.target.value = ""; // پاک کردن انتخاب
        return;
      }
      
      // Resize تصویر برای موبایل (حداکثر 1920px عرض)
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // اگر تصویر بزرگتر از 1920px عرض است، resize کن
          const maxWidth = 1920;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // تبدیل به base64 با کیفیت 0.9
            const resizedBase64 = canvas.toDataURL("image/jpeg", 0.9);
            console.log("Image resized and converted to base64, length:", resizedBase64.length);
            console.log("Image preview (first 100 chars):", resizedBase64.substring(0, 100));
            setNewPostImage(resizedBase64);
          } else {
            // Fallback: استفاده از تصویر اصلی
            const result = reader.result as string;
            console.log("Canvas context not available, using original image");
            setNewPostImage(result);
          }
        };
        img.onerror = () => {
          console.error("Error loading image for resize");
          // Fallback: استفاده از تصویر اصلی
          const result = reader.result as string;
          setNewPostImage(result);
        };
        img.src = reader.result as string;
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("خطا در خواندن فایل. لطفاً دوباره تلاش کنید");
        e.target.value = ""; // پاک کردن انتخاب
        setNewPostImage(null);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No file selected");
      setNewPostImage(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این پست را حذف کنید؟")) {
      return;
    }

    setDeleting(postId);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId));
        alert("پست با موفقیت حذف شد");
      } else {
        const data = await response.json();
        alert(data.error || "خطا در حذف پست");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("خطا در حذف پست");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="mobile-container bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">وین گرام</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition text-lg font-light"
            title="ایجاد پست جدید"
          >
            +
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 mb-2">هیچ پستی وجود ندارد</p>
            <p className="text-sm text-gray-400">
              اولین پست را ایجاد کنید و با دیگران به اشتراک بگذارید
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border-b border-gray-200 mb-2"
            >
              {/* Post Header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {post.company.logo ? (
                      <img
                        src={
                          typeof post.company.logo === "string"
                            ? post.company.logo
                            : String(post.company.logo)
                        }
                        alt={post.company.name || "Company"}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `
                              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span class="text-blue-600 font-bold text-sm">
                                  ${post.company.name && post.company.name.length > 0 ? post.company.name.charAt(0) : "C"}
                                </span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <>
                        {isPetrochemicalCompany(post.company.name) && getPetrochemicalLogo(post.company.name) ? (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                            <Image
                              src={getPetrochemicalLogo(post.company.name)!}
                              alt={post.company.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-contain p-1"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                if (target.parentElement) {
                                  const fallback = document.createElement("span");
                                  fallback.className = "text-blue-600 font-bold text-sm";
                                  fallback.textContent = post.company.name && post.company.name.length > 0 ? post.company.name.charAt(0) : "C";
                                  target.parentElement.appendChild(fallback);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">
                              {post.company.name && post.company.name.length > 0 ? post.company.name.charAt(0) : "C"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <div className="flex items-center gap-1">
                        <h3 className="font-bold text-sm">
                          {post.company.name}
                        </h3>
                        {post.company.isVerified && (
                          <span className="text-blue-500">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Delete Button - Only show if post belongs to current user */}
                  {userCompanyId && post.companyId === userCompanyId && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={deleting === post.id}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-1"
                      title="حذف پست"
                    >
                      {deleting === post.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Post Content */}
                {post.content && (
                  <p className="text-sm mb-3 whitespace-pre-wrap">
                    {post.content}
                  </p>
                )}

                {/* Tender Tag */}
                {post.tenderId && (
                  <div className="mb-3">
                    <Link
                      href={`/tender-details?id=${post.tenderId}`}
                      className="inline-flex items-center gap-1 text-blue-600 text-xs hover:text-blue-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span>مربوط به مناقصه</span>
                    </Link>
                  </div>
                )}

                {/* Post Image */}
                <div className="w-full mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
                  {post.imageUrl ? (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      className="w-full h-auto object-cover"
                      onLoad={() => {
                        console.log(`Post ${post.id}: Image loaded successfully`);
                      }}
                      onError={(e) => {
                        console.error(`Post ${post.id}: Image failed to load`, {
                          imageUrl: post.imageUrl,
                          imageUrlLength: post.imageUrl?.length,
                          imageUrlPreview: post.imageUrl?.substring(0, 50),
                        });
                        // اگر تصویر لود نشد، placeholder نمایش بده
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        if (target.parentElement) {
                          target.parentElement.className =
                            "w-full mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center min-h-[200px]";
                          target.parentElement.innerHTML = `
                            <div class="text-center p-8">
                              <svg class="w-24 h-24 text-blue-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <p class="text-blue-700 font-medium">مناقصه</p>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center min-h-[200px] p-8">
                      <div className="text-center">
                        <svg
                          className="w-24 h-24 text-blue-600 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-blue-700 font-medium">مناقصه</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 transition text-red-500 hover:text-red-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill={post.userLiked ? "#ef4444" : "none"}
                      stroke="#ef4444"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-red-500">
                      {post.likes}
                    </span>
                  </button>
                  <button
                    onClick={() => handleShowComments(post)}
                    className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                  <div className="flex items-center gap-1 text-gray-600">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span className="text-sm font-medium">{post.views}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">ایجاد پست جدید</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPostContent("");
                  setNewPostImage(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  متن پست
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="چه چیزی در ذهن دارید؟"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  تصویر (اختیاری)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                {newPostImage && (
                  <div className="mt-2 relative">
                    <img
                      src={newPostImage}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                      onLoad={() => {
                        console.log("Preview image loaded successfully");
                      }}
                      onError={(e) => {
                        console.error("Preview image failed to load:", e);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setNewPostImage(null);
                        // Reset file input
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.value = "";
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                )}
              </div>
              <button
                onClick={handleCreatePost}
                disabled={posting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {posting ? "در حال ارسال..." : "ارسال پست"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">نظرات</h3>
              <button
                onClick={() => {
                  setShowComments(false);
                  setSelectedPost(null);
                  setComments([]);
                  setNewComment("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  هنوز نظری ثبت نشده است
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    {comment.user.company?.logo ? (
                      <img
                        src={
                          typeof comment.user.company.logo === "string"
                            ? comment.user.company.logo
                            : String(comment.user.company.logo)
                        }
                        alt={comment.user.company.name || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `
                              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span class="text-blue-600 font-bold text-xs">
                                  ${
                                    (comment.user.company?.name && comment.user.company.name.length > 0 ? comment.user.company.name.charAt(0) : "U")
                                  }
                                </span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs">
                          {comment.user.company?.name && comment.user.company.name.length > 0 ? comment.user.company.name.charAt(0) : "U"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <p className="text-xs font-bold mb-1">
                          {comment.user.company?.name || comment.user.phone}
                        </p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddComment();
                  }
                }}
                placeholder="نظر خود را بنویسید..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                ارسال
              </button>
            </div>
          </div>
        </div>
      )}

      <SupplierNavigation />
    </div>
  );
}
