window.BCJN_CONFIG = {
  refreshMinutes: 5,

  // Vul deze twee waarden in vanuit Supabase.
  // Zonder deze gegevens werkt de pagina als demo, maar niet als gedeelde online site.
  supabaseUrl: "https://iipyzhlbpdpwfvdhdnuw.supabase.co",
  supabaseAnonKey: "sb_publishable_KzZxZwXKhAPmupGd51vOFQ_DqEZFyMU",
  supabaseTable: "bcjn_state",
  supabaseStateId: "bcjn-zomer-2026",

  // Kaart-provider. De publieke OpenStreetMap-tiles hebben geen aparte API-key nodig.
  // Later kun je hier een andere provider achter hangen zonder de activiteitendata te wijzigen.
  mapProvider: "leaflet",
  mapTileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  mapAttribution: "&copy; OpenStreetMap contributors"
};
