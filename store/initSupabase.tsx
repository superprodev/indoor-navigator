import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://kjgvvshdwzbrtsgngygg.supabase.co";
const baseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ3Z2c2hkd3picnRzZ25neWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MTAxMjcsImV4cCI6MjA4MDE4NjEyN30.UIgcn4iQqKQgZKR6zrNHJr0BR-ei-6FUlpCDKvwZYG8";

// Better put your these secret keys in .env file
export const supabase = createClient(baseUrl, baseKey);
supabase.auth.signInWithPassword({
    email: 'yurgentcollin@outlook.com',
    password: 'Collin980620!@#'
});
