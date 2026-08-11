/* =========================================================
   NOTHINGBUH FABRICS — configuration
   ---------------------------------------------------------
   EDIT THE VALUES BELOW, then the whole site goes live.
   Get URL + anon key from: Supabase Dashboard > Project
   Settings > API  ("Project URL" and "anon public" key).
   The anon key is SAFE in the browser — Row Level Security
   (sql/schema.sql) is what actually protects the data.
   Until you fill these in, the site runs on demo fabrics
   so you can preview every page.
   ========================================================= */
window.NBF_CONFIG = {
  SUPABASE_URL: "https://wykiogugozbvpqxtaubu.supabase.co",     // e.g. https://xxxx.supabase.co
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5a2lvZ3Vnb3pidnBxeHRhdWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0Njk1MTYsImV4cCI6MjEwMjA0NTUxNn0.z9MPKWOVrZQxGPfZG50rfsLruFcynn8xmqz3ghlmtwM",
  WA_NUMBER: "2348000000000",        // WhatsApp, digits only, incl. country code
  CURRENCY: "\u20a6",               // Naira sign
  DELIVERY_LAGOS: 2500,                    // flat Lagos delivery fee (demo)
  DELIVERY_NATION: 5000,                    // flat nationwide delivery fee (demo)
  BRAND: "Nothingbuh Fabrics",
  IG_HANDLE: "@nothingbuhfabrics"
};

/* ---- client bootstrap (don't edit below) ---- */
(function () {
  var c = window.NBF_CONFIG;
  var configured =
    typeof c.SUPABASE_URL === "string" &&
    c.SUPABASE_URL.indexOf("https://") === 0 &&
    c.SUPABASE_URL.indexOf("YOUR_") === -1 &&
    c.SUPABASE_ANON_KEY.indexOf("YOUR_") === -1;

  window.NBF_CONFIGURED = configured;

  if (configured && window.supabase && window.supabase.createClient) {
    window.sb = window.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
  } else {
    window.sb = null;
    if (!configured) {
      console.warn("[Nothingbuh] Supabase not configured — edit js/config.js. " +
        "Running on demo data until then.");
    }
  }
})();
