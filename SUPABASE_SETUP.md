# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

## 2. Get Your Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env` file in your project root with:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (for development, you can use `exp://localhost:8081`)
3. Set up email templates if desired
4. Configure any additional auth providers you want to use

## 4. Database Setup (Optional)

If you need user profiles or additional user data:

1. Go to SQL Editor in your Supabase dashboard
2. Create a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## 5. Test Your Setup

1. Run your app with `npm start`
2. Navigate to the Sign Up screen
3. Try creating an account
4. Check your Supabase dashboard > Authentication > Users to see the new user
