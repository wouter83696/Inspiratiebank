window.BCJN_CONFIG = {
  refreshMinutes: 5,

  // Supabase is de online opslag voor gedeelde agenda- en inspiratiebankdata.
  // 1. Maak de tabel uit ../supabase/schema.sql aan.
  // 2. Vul hieronder je project-url en anon public key in.
  // 3. Zet dit bestand terug als website-bestanden/config.js.
  // Publieke bezoekers gebruiken deze sleutel. Schrijven loopt via de beperkte
  // RPC-functies uit het Supabase-schema; zet nooit een service role key in dit bestand.
  supabaseUrl: "https://jouw-project.supabase.co",
  supabaseAnonKey: "jouw-anon-public-key",
  supabaseTable: "bcjn_state",
  supabaseStateId: "bcjn-zomer-2026"
};
