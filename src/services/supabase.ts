import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://obpezocujzdaznrdgwoo.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
