/*
  # Create Blog Posts Table

  1. New Tables
    - `blog_posts`
      - Basic Info:
        - `id` (uuid, primary key)
        - `title` (text)
        - `slug` (text, unique)
        - `content` (text)
        - `excerpt` (text)
        - `author` (uuid, references users)
        - `created_at` (timestamp)
      
      - SEO:
        - `meta_description` (text)
        - `meta_keywords` (text)
        - `canonical_url` (text)
        - `structured_data` (jsonb)
      
      - Media & Organization:
        - `featured_image_url` (text)
        - `table_of_contents` (jsonb)
        - `reading_time_minutes` (integer)
        - `is_featured` (boolean)
        - `featured_order` (integer)
      
      - Social & Analytics:
        - `social_sharing_data` (jsonb)
        - `analytics_data` (jsonb)
      
      - Version Control:
        - `version_number` (decimal)
        - `last_modified_at` (timestamp)
        - `last_modified_by` (uuid, references users)
      
      - Engagement:
        - `allow_comments` (boolean)
        - `engagement_settings` (jsonb)
      
      - Content Relationships:
        - `related_posts` (jsonb)
        - `series_id` (text)
        - `series_order` (integer)

  2. Security
    - Enable RLS on blog_posts table
    - Add policies for authenticated users
*/

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  -- Basic Info
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  author uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  
  -- SEO
  meta_description text,
  meta_keywords text,
  canonical_url text,
  structured_data jsonb DEFAULT '{}',
  
  -- Media & Organization
  featured_image_url text,
  table_of_contents jsonb DEFAULT '{}',
  reading_time_minutes integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  featured_order integer DEFAULT 0,
  
  -- Social & Analytics
  social_sharing_data jsonb DEFAULT '{"facebook_shares": 0, "twitter_shares": 0, "linkedin_shares": 0}'::jsonb,
  analytics_data jsonb DEFAULT '{"views": 0, "unique_visitors": 0, "avg_time_on_page": 0}'::jsonb,
  
  -- Version Control
  version_number decimal DEFAULT 1.0,
  last_modified_at timestamptz DEFAULT now(),
  last_modified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Engagement
  allow_comments boolean DEFAULT true,
  engagement_settings jsonb DEFAULT '{"allow_reactions": true, "show_share_buttons": true}'::jsonb,
  
  -- Content Relationships
  related_posts jsonb DEFAULT '[]'::jsonb,
  series_id text,
  series_order integer,

  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT valid_featured_image_url CHECK (featured_image_url ~ '^https?://.*$'),
  CONSTRAINT valid_canonical_url CHECK (canonical_url ~ '^https?://.*$')
);

-- Create indexes for better performance
CREATE INDEX blog_posts_slug_idx ON blog_posts (slug);
CREATE INDEX blog_posts_created_at_idx ON blog_posts (created_at DESC);
CREATE INDEX blog_posts_is_featured_idx ON blog_posts (is_featured) WHERE is_featured = true;
CREATE INDEX blog_posts_series_idx ON blog_posts (series_id, series_order) WHERE series_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view published blog posts"
  ON blog_posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create blog posts"
  ON blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

CREATE POLICY "Authors can update their own posts"
  ON blog_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author OR auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

CREATE POLICY "Admins can delete blog posts"
  ON blog_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_admin = true));

-- Create function to update last_modified_at
CREATE OR REPLACE FUNCTION update_blog_post_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_modified_at
CREATE TRIGGER update_blog_post_modified_trigger
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_modified();


this is new 
it mean i need to run 2 sql ??

Yes, you need to run 2 SQL commands in phpMyAdmin to set up the blog functionality:

First create the blog_posts table:

CREATE TABLE blog_posts (
  id VARCHAR(36) PRIMARY KEY,
  title TEXT NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content LONGTEXT NOT NULL,
  excerpt TEXT,
  author VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  meta_description TEXT,
  meta_keywords TEXT, 
  canonical_url VARCHAR(255),
  structured_data JSON,
  featured_image_url VARCHAR(255),
  table_of_contents JSON,
  reading_time_minutes INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_order INT DEFAULT 0,
  social_sharing_data JSON,
  analytics_data JSON,
  version_number DECIMAL(3,1) DEFAULT 1.0,
  last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_modified_by VARCHAR(36),
  allow_comments BOOLEAN DEFAULT TRUE,
  engagement_settings JSON,
  related_posts JSON,
  series_id VARCHAR(36),
  series_order INT,
  FOREIGN KEY (author) REFERENCES users(id),
  FOREIGN KEY (last_modified_by) REFERENCES users(id)
);
Then create the blog_images table:

CREATE TABLE blog_images (
  id VARCHAR(36) PRIMARY KEY,
  post_id VARCHAR(36) NOT NULL,
  url VARCHAR(255) NOT NULL,
  alt_text TEXT,
  caption TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `order` INT DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);
You can run these commands in phpMyAdmin by:

Select your database
Click the "SQL" tab
Paste each command
Click "Go" to execute
Make sure to run the blog_posts table creation first since blog_images references it with a foreign key.


