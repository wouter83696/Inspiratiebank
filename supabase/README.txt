Supabase instellen voor Inspiratiebank - Zomer 2026

1. Maak een Supabase-project aan.
2. Open SQL Editor in Supabase.
3. Plak de inhoud van schema.sql en voer die uit.
4. Kopieer de Project URL en anon public key naar:
   website-bestanden/config.js
5. Gebruik voor het automatische broncheck-script en andere schrijfacties de service role key als omgevingsvariabele.

Benodigde variabelen voor de broncheck:

SUPABASE_URL=https://jouw-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
SUPABASE_TABLE=bcjn_state
SUPABASE_STATE_ID=bcjn-zomer-2026

Dagelijkse broncheck:

node website-bestanden/scripts/run-source-check.js

Automatisch via GitHub:
- De workflow staat in .github/workflows/dagelijkse-broncheck.yml.
- Maak in de repository secrets SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY aan.
- De controle draait dagelijks en kan ook handmatig worden gestart.

Belangrijk:
- Zet de service role key nooit in config.js en nooit zichtbaar in de browser.
- De gewone website gebruikt alleen de anon public key.
- Publieke inzendingen en meldingen schrijven via beperkte RPC-functies.
- Beheeracties schrijven via een RPC-functie die het beheerwachtwoord controleert.
- Het standaard beheerwachtwoord is 6545. Verander dit na installatie in Supabase door de hash in bcjn_admin_settings te vervangen.
