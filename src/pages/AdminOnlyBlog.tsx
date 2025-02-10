import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, Search, Filter, Tag, Link as LinkIcon,
  Image, Eye, Settings, Save, RefreshCw, ArrowLeft, Globe, Shield
} from 'lucide-react';
import axios from 'axios';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  featured_image: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export function AdminOnlyBlog() {
  // Authentication state
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');

  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    meta_title: '',
    meta_description: '',
    keywords: '',
    featured_image: '',
    status: 'draft' as const
  });

  // Check for existing auth on mount
  useEffect(() => {
    const storedAuth = sessionStorage.getItem('adminAuth');
    if (storedAuth === import.meta.env.VITE_ADMIN_PASSPHRASE) {
      setIsAuthorized(true);
      fetchPosts();
    }
  }, []);

  // Handle authentication
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase === import.meta.env.VITE_ADMIN_PASSPHRASE) {
      sessionStorage.setItem('adminAuth', passphrase);
      setIsAuthorized(true);
      fetchPosts();
    } else {
      setError('Invalid passphrase');
    }
  };

  // If not authorized, show login form
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <form onSubmit={handleAuth} className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-6 text-center">
            Admin Access Required
          </h1>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">
              {error}
            </div>
          )}
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 mb-4 focus:outline-none focus:border-blue-500"
            placeholder="Enter passphrase"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 transition-colors"
          >
            Access Admin Panel
          </button>
        </form>
      </div>
    );
  }

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/blog/posts`,
        {
          headers: {
            'Admin-Access': import.meta.env.VITE_ADMIN_PASSPHRASE
          }
        }
      );
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError('Failed to fetch blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      setIsLoading(true);
      if (selectedPost && isEditing) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/blog/posts/${selectedPost.id}`,
          formData,
          {
            headers: {
              'Admin-Access': import.meta.env.VITE_ADMIN_PASSPHRASE
            }
          }
        );
        setSuccess('Blog post updated successfully');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/blog/posts`,
          formData,
          {
            headers: {
              'Admin-Access': import.meta.env.VITE_ADMIN_PASSPHRASE
            }
          }
        );
        setSuccess('Blog post created successfully');
      }
      
      fetchPosts();
      resetForm();
    } catch (error: any) {
      console.error('Failed to save post:', error);
      setError(error.response?.data?.error || 'Failed to save blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      setIsLoading(true);
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/blog/posts/${id}`,
        {
          headers: {
            'Admin-Access': import.meta.env.VITE_ADMIN_PASSPHRASE
          }
        }
      );
      fetchPosts();
      setSuccess('Blog post deleted successfully');
      if (selectedPost?.id === id) {
        resetForm();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      setError('Failed to delete blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      keywords: post.keywords,
      featured_image: post.featured_image,
      status: post.status
    });
    setIsEditing(true);
  };

  const resetForm = () => {
    setSelectedPost(null);
    setIsEditing(false);
    setFormData({
      title: '',
      content: '',
      category: '',
      meta_title: '',
      meta_description: '',
      keywords: '',
      featured_image: '',
      status: 'draft'
    });
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Comma-separated keywords"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : isEditing ? (
                      'Update Post'
                    ) : (
                      'Create Post'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Posts List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search posts..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {Array.from(new Set(posts.map(post => post.category))).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divide-y">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span>{post.category}</span>
                          <span className={`${
                            post.status === 'published' ? 'text-green-600' : 'text-yellow-600'
                          }`}>
                            {post.status}
                          </span>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{post.content}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPosts.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No blog posts found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}