-- Criar bucket para fotos dos carros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-photos',
  'car-photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Criar bucket para documentos dos carros
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'car-documents',
  'car-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket car-photos
CREATE POLICY "Public can view car photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-photos');

CREATE POLICY "Authenticated users can upload car photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update car photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'car-photos' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete car photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'car-photos' AND 
    auth.role() = 'authenticated'
  );

-- Políticas para o bucket car-documents
CREATE POLICY "Authenticated users can view car documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'car-documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can upload car documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'car-documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can update car documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'car-documents' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can delete car documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'car-documents' AND 
    auth.role() = 'authenticated'
  );