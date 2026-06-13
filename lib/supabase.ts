import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tfdmcuowasuakmcznpol.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZG1jdW93YXN1YWttY3pucG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNDEyMTUsImV4cCI6MjA5NjkxNzIxNX0.Ueem2OCrzG7kGNXCkTf5bfBk5JM1u5UEh2z4cvaPe5Y";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);