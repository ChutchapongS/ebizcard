-- Insert default templates
INSERT INTO public.templates (name, theme, preview_url) VALUES
('Classic', 'classic', 'https://images.unsplash.com/photo-1599305445771-b0be54c8c6c6?w=400&h=250&fit=crop'),
('Modern', 'modern', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=250&fit=crop'),
('Minimal', 'minimal', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=250&fit=crop'),
('Professional', 'professional', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop'),
('Creative', 'creative', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=250&fit=crop'),
('Elegant', 'elegant', 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop')
ON CONFLICT (id) DO NOTHING;
