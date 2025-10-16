-- Fix embeddings table INSERT policy to prevent unauthorized injection
DROP POLICY IF EXISTS "System can insert embeddings" ON public.embeddings;

-- Only authenticated users can insert their own embeddings, or admins can insert any
CREATE POLICY "Users can insert their own embeddings" 
ON public.embeddings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Fix attendance_logs INSERT policy to prevent forged attendance
DROP POLICY IF EXISTS "System can insert attendance" ON public.attendance_logs;

-- Only authenticated users can mark their own attendance, or admins can insert any
CREATE POLICY "Users can mark their own attendance" 
ON public.attendance_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));