window.BCJN_CONFIG = {
  refreshMinutes: 5,

  // Vul deze twee waarden in vanuit Supabase.
  // Zonder deze gegevens werkt de pagina als demo, maar niet als gedeelde online site.
  supabaseUrl: "https://iipyzhlbpdpwfvdhdnuw.supabase.co",
  supabaseAnonKey: "sb_publishable_KzZxZwXKhAPmupGd51vOFQ_DqEZFyMU",
  supabaseTable: "bcjn_state",
  supabaseStateId: "bcjn-zomer-2026",

  // Kaart-provider. OpenStreetMap Standard werkt zonder API-key.
  // Wil je de rustigere CARTO Voyager-kaart terug, vraag gratis een CARTO Basemaps key aan
  // en plak die hieronder. Zet mapTileUrl dan op:
  // "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
  mapProvider: "leaflet",
  mapTileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  mapCartoApiKey: "",
  mapReferenceTileUrl: "",
  mapAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
};
