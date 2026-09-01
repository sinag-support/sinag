"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Users,
  Loader2,
  Image as ImageIcon,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BlogForm } from "./components/blog-form";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  author: string;
  published: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    likes: number;
    comments: number;
  };
}

interface PaginatedResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  replies?: Comment[];
}

interface Like {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  createdAt: string;
}

export default function BlogManagementPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Engagement states
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loadingEngagement, setLoadingEngagement] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "likes">("comments");
  const [deletingEngagement, setDeletingEngagement] = useState<string | null>(
    null,
  );

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/admin/blog?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data: PaginatedResponse = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [search, page]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/blog/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Blog post deleted");
        fetchPosts();
      } else {
        toast.error("Failed to delete post");
      }
    } catch {
      toast.error("Error deleting post");
    } finally {
      setDeleteId(null);
    }
  };

  const viewEngagement = async (post: BlogPost) => {
    setSelectedPost(post);
    setEngagementDialogOpen(true);
    setLoadingEngagement(true);
    setActiveTab("comments");

    try {
      const commentsRes = await fetch(`/api/blog/${post.slug}/comments`);
      if (commentsRes.ok) {
        const data = await commentsRes.json();
        setComments(data);
      } else {
        setComments([]);
      }

      const likesRes = await fetch(`/api/admin/blog/${post.id}/likes`);
      if (likesRes.ok) {
        const data = await likesRes.json();
        setLikes(data);
      } else {
        setLikes([]);
      }
    } catch (error) {
      console.error("Error fetching engagement data:", error);
      toast.error("Failed to load engagement data");
    } finally {
      setLoadingEngagement(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingEngagement(commentId);
    try {
      const res = await fetch(`/api/admin/blog/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Comment deleted");
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            _count: {
              ...selectedPost._count,
              comments: selectedPost._count.comments - 1,
            },
          });
          setPosts((prev) =>
            prev.map((p) =>
              p.id === selectedPost.id
                ? {
                    ...p,
                    _count: { ...p._count, comments: p._count.comments - 1 },
                  }
                : p,
            ),
          );
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete comment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingEngagement(null);
    }
  };

  const deleteLike = async (likeId: string) => {
    setDeletingEngagement(likeId);
    try {
      const res = await fetch(`/api/admin/blog/likes/${likeId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Like removed");
        setLikes((prev) => prev.filter((l) => l.id !== likeId));
        if (selectedPost) {
          setSelectedPost({
            ...selectedPost,
            _count: {
              ...selectedPost._count,
              likes: selectedPost._count.likes - 1,
            },
          });
          setPosts((prev) =>
            prev.map((p) =>
              p.id === selectedPost.id
                ? { ...p, _count: { ...p._count, likes: p._count.likes - 1 } }
                : p,
            ),
          );
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to remove like");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingEngagement(null);
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-32" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-5 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  const renderSkeletonCards = () => {
    return Array.from({ length: 4 }).map((_, i) => (
      <Card
        key={i}
        className="overflow-hidden !bg-background shadow-none border-none box-border w-auto mx-0.5 rounded-xl min-w-0"
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-16 w-20 rounded-md flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-sm" />
              <Skeleton className="h-5 w-12 rounded-sm" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-sm" />
              <Skeleton className="h-7 w-7 rounded-sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  const BlogPostCard = ({ post }: { post: BlogPost }) => {
    return (
      <Card className="overflow-hidden !bg-background shadow-none border-none box-border w-auto mx-0.5 rounded-xl min-w-0">
        <CardContent className="p-3">
          <div className="flex items-start gap-3 w-full">
            {/* Cover Image */}
            <div className="h-16 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2 leading-snug break-words">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                  {post.author}
                </span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  •
                </span>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Tags and Stats */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 min-w-0">
              {post.tags.length > 0 && (
                <div className="flex items-center gap-1 min-w-0">
                  <Tag className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {post.tags.slice(0, 2).join(", ")}
                    {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant={post.published ? "default" : "secondary"}
                className="text-[10px] px-2 py-0 h-5 flex-shrink-0 whitespace-nowrap rounded-sm"
              >
                {post.published ? "Published" : "Draft"}
              </Badge>

              <button
                onClick={() => viewEngagement(post)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              >
                <Heart className="h-3.5 w-3.5" />
                <span>{post._count.likes}</span>
              </button>

              <button
                onClick={() => viewEngagement(post)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{post._count.comments}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 !bg-background hover:!bg-accent flex-shrink-0 rounded-sm"
              onClick={() => {
                setEditingPost(post);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 w-7 p-0 flex-shrink-0 rounded-sm"
              onClick={() => setDeleteId(post.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden box-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
            Blog Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Create and manage blog posts
          </p>
        </div>
      </div>

      {/* Search Bar & 1-Line Equal-Width Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full min-w-0 box-border">
        <div className="relative flex-1 min-w-0 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by title, author, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-full !bg-background rounded-md"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:ml-auto flex-shrink-0">
          <Button
            variant="outline"
            onClick={fetchPosts}
            className="w-full !bg-background hover:!bg-accent rounded-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>

          <Button
            onClick={() => {
              setEditingPost(null);
              setDialogOpen(true);
            }}
            className="w-full rounded-md"
          >
            <Plus className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground truncate">
        {loading ? (
          <Skeleton className="h-4 w-32 inline-block" />
        ) : (
          <>
            {total} {total === 1 ? "post" : "posts"} found
            {search && ` matching "${search}"`}
          </>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2 w-full min-w-0 box-border">
        {loading ? (
          renderSkeletonCards()
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {search
              ? "No posts found matching your search"
              : "No blog posts yet"}
          </div>
        ) : (
          posts.map((post) => <BlogPostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border border-border rounded-md overflow-hidden w-full max-w-full box-border">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Title</TableHead>
                <TableHead className="min-w-[100px]">Author</TableHead>
                <TableHead className="min-w-[120px]">Tags</TableHead>
                <TableHead className="min-w-[80px]">Stats</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[100px]">Date</TableHead>
                <TableHead className="text-right min-w-[100px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {search
                      ? "No posts found matching your search"
                      : "No blog posts yet"}
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {post.coverImage && (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <span className="font-medium line-clamp-1">
                          {post.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{post.author}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <button
                          onClick={() => viewEngagement(post)}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <Heart className="h-3.5 w-3.5" />
                          {post._count.likes}
                        </button>
                        <button
                          onClick={() => viewEngagement(post)}
                          className="flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post._count.comments}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"}>
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(post.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="!bg-background hover:!bg-accent h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-sm"
                        onClick={() => {
                          setEditingPost(post);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-sm"
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {loading ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              `Showing ${(page - 1) * limit + 1} - ${Math.min(
                page * limit,
                total,
              )} of ${total}`
            )}
          </div>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    disabled={loading}
                    className="h-8 w-8 p-0 text-sm rounded-sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages || loading}
              className="h-8 w-8 p-0 rounded-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Blog Creation & Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] overflow-y-auto !bg-background rounded-md [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Edit Post" : "Create New Post"}
            </DialogTitle>
            <DialogDescription>
              {editingPost ? "Update your blog post" : "Write a new blog post"}
            </DialogDescription>
          </DialogHeader>
          <BlogForm
            initialData={editingPost}
            onSuccess={() => {
              setDialogOpen(false);
              fetchPosts();
            }}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Engagement Dialog */}
      <Dialog
        open={engagementDialogOpen}
        onOpenChange={setEngagementDialogOpen}
      >
        <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto !bg-background rounded-md [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Engagement for "{selectedPost?.title}"
            </DialogTitle>
            <DialogDescription>
              View who liked and commented on this post. Admin can delete
              comments and likes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b pb-2">
            <Button
              variant={activeTab === "comments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("comments")}
              className="gap-2 rounded-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Comments ({comments.length})
            </Button>
            <Button
              variant={activeTab === "likes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("likes")}
              className="gap-2 rounded-sm"
            >
              <Heart className="h-4 w-4" />
              Likes ({likes.length})
            </Button>
          </div>

          {loadingEngagement ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {activeTab === "comments" ? (
                comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet on this post</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b pb-3 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(comment.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user.name || comment.user.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-0.5">{comment.content}</p>
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 pl-4 border-l-2 border-muted space-y-2">
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="flex items-start gap-2"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px] bg-muted">
                                      {getInitials(reply.user.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-xs">
                                        {reply.user.name || reply.user.email}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatDateTime(reply.createdAt)}
                                      </span>
                                    </div>
                                    <p className="text-xs mt-0.5">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 !bg-background rounded-sm"
                          onClick={() => deleteComment(comment.id)}
                          disabled={deletingEngagement === comment.id}
                        >
                          {deletingEngagement === comment.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )
              ) : likes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No likes yet on this post</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {likes.map((like) => (
                    <div
                      key={like.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/30 !bg-background"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(like.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {like.user.name || like.user.email}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(like.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 !bg-background rounded-sm"
                        onClick={() => deleteLike(like.id)}
                        disabled={deletingEngagement === like.id}
                      >
                        {deletingEngagement === like.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="w-[90vw] max-w-md !bg-background rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              blog post and all associated comments and likes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="!bg-background hover:!bg-accent mt-0 rounded-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-sm">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
