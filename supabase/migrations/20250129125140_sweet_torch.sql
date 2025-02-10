/*
  # Add Blog Post Images Support

  1. New Tables
    - `blog_images`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key)
      - `url` (text)
      - `alt_text` (text)
      - `caption` (text)
      - `is_featured` (boolean)
      - `created_at` (timestamp)
      - `order` (integer)

  2. Security
    - Enable RLS on `blog_images` table
    - Add policies for authenticated users
*/

-- Create blog images table
CREATE TABLE IF NOT EXISTS blog_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  caption text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  "order" integer DEFAULT 0,
  CHECK (url ~ '^https?://')
);

-- Enable RLS
ALTER TABLE blog_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view blog images"
  ON blog_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert blog images"
  ON blog_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Admins can update blog images"
  ON blog_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "Admins can delete blog images"
  ON blog_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));