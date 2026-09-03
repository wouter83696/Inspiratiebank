window.BCJN_CONFIG = {
  refreshMinutes: 5,

  // Vul deze twee waarden in vanuit Supabase.
  // Zonder deze gegevens werkt de pagina als demo, maar niet als gedeelde online site.
  supabaseUrl: "https://iipyzhlbpdpwfvdhdnuw.supabase.co",
  supabaseAnonKey: "sb_publishable_KzZxZwXKhAPmupGd51vOFQ_DqEZFyMU",
  supabaseTable: "bcjn_state",
  supabaseStateId: "bcjn-zomer-2026",

  // Kaart-provider. Esri World Street Map geeft een rustige kaart met zachte kleur zonder API-key.
  // Later kun je hier een andere provider achter hangen zonder de activiteitendata te wijzigen.
  mapProvider: "leaflet",
  mapTileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  mapReferenceTileUrl: "",
  mapAttribution: "Sources: Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS User Community"
};
