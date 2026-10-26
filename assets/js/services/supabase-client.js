import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rigqlgbtscxbbmbguffe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3dHKTZbvdtw5p4plUg1zNA_242POqid";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);