import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Clock, ChevronRight, Tag } from 'lucide-react';
import axios from 'axios';
import { PublicLayout } from '../components/PublicLayout';
import { Helmet } from 'react-helmet-async';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  meta_title: string;
  meta_description: string;
  featured_image: string;
  author_email: string;
  created_at: string;
}

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/blog/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/blog/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <Helmet>
        <title>Blog - Latest Articles and Updates</title>
        <meta name="description" content="Read our latest articles about email privacy, security, and digital well-being." />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Blog
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay informed about email privacy, security, and digital well-being
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg mb-8">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {post.featured_image && (
                  <Link to={`/blog/${post.slug}`}>
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                    />
                  </Link>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      {post.category}
                    </span>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="block group"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#4A90E2] transition-colors">
                      {post.title}
                    </h2>
                  </Link>
                  <div
                    className="text-gray-600 mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: post.content.substring(0, 150) + '...'
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      By {post.author_email}
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center text-[#4A90E2] hover:text-[#357ABD] transition-colors"
                    >
                      Read More
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No blog posts found.</p>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}