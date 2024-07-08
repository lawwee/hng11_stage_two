const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.PROJECT_URL;
const supabaseKey = process.env.API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
