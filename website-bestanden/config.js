window.BCJN_CONFIG = {
  refreshMinutes: 5,

  // Vul deze twee waarden in vanuit Supabase.
  // Zonder deze gegevens werkt de pagina als demo, maar niet als gedeelde online site.
  supabaseUrl: "https://iipyzhlbpdpwfvdhdnuw.supabase.co",
  supabaseAnonKey: "sb_publishable_KzZxZwXKhAPmupGd51vOFQ_DqEZFyMU",
  supabaseTable: "bcjn_state",
  supabaseStateId: "bcjn-zomer-2026",

  // Kaart-provider. Esri World Street Map werkt zonder API-key en oogt dichter bij Google Maps.
  // Wil je exact de rustigere CARTO Voyager-kaart terug, vraag gratis een CARTO Basemaps key aan
  // en plak die hieronder. Zet mapTileUrl dan op:
  // "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
  mapProvider: "leaflet",
  mapTileUrl: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  mapCartoApiKey: "",
  mapReferenceTileUrl: "",
  mapAttribution: "Sources: Esri, HERE, Garmin, FAO, NOAA, USGS, &copy; OpenStreetMap contributors, and the GIS User Community"
};
