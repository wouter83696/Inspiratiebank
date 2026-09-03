window.BCJN_CONFIG = {
  refreshMinutes: 5,

  // Vul deze twee waarden in vanuit Supabase.
  // Zonder deze gegevens werkt de pagina als demo, maar niet als gedeelde online site.
  supabaseUrl: "https://iipyzhlbpdpwfvdhdnuw.supabase.co",
  supabaseAnonKey: "sb_publishable_KzZxZwXKhAPmupGd51vOFQ_DqEZFyMU",
  supabaseTable: "bcjn_state",
  supabaseStateId: "bcjn-zomer-2026",

  // Kaart-provider. OpenFreeMap Positron geeft een rustige kaartstijl zonder API-key.
  // Later kun je hier een andere provider achter hangen zonder de activiteitendata te wijzigen.
  mapProvider: "leaflet",
  mapStyleUrl: "https://tiles.openfreemap.org/styles/positron",
  mapTileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  mapAttribution: '<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
};
