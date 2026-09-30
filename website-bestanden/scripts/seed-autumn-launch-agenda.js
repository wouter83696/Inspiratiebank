#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const dataPath = path.resolve(__dirname, '..', 'data', 'zomerprogramma_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const sources = {
  musis:'https://www.musisenstadstheater.nl/nl/agenda/theatervoorstellingen',
  focus:'https://tickets.focusarnhem.nl/agenda.php',
  lux:'https://www.lux-nijmegen.nl/programma/',
  visitNijmegen:'https://www.visitnijmegen.com/evenementen?locations=912&order=asc&page=1&sort=calendar'
};

const event = (title, date, time, domain, where, cost, stimulus, fit, source, url, tags=[]) => ({
  title,
  date,
  time,
  domain,
  where,
  locationType:'Buiten de deur',
  cost,
  stimulus,
  fit,
  source,
  url,
  tags:[...tags, 'najaar 2026'],
  distanceBand:'Dichtbij (0-10 km)'
});

const launchEvents = [
  event('Alle kinderen stinken (6+)', 'Zaterdag 3 oktober 2026', '16.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel/hoog', 'Interactieve familievoorstelling met humor, tempo en onverwachte wendingen.', 'Musis & Stadstheater', sources.musis, ['familie','theater']),
  event('OPA presenteert Arnhemse Nieuwe 2026', 'Woensdag 7 oktober 2026', '19.00', 'Creatief & Expressie', 'Focus Filmtheater, Arnhem', '€', 'Middel', 'Avond met korte presentaties en werk van nieuwe Arnhemse makers.', 'Focus Filmtheater', 'https://www.focusarnhem.nl/agenda/opa-presenteert-arnhemse-nieuwe-2026/', ['film','design','makers']),
  event('Yentl en de Boer – Rekhalzen', 'Woensdag 7 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Muzikaal cabaret met liedjes, verhalen en een vaste zitplaats.', 'Musis & Stadstheater', sources.musis, ['cabaret','muziek']),
  event('Komt voor de bakker', 'Donderdag 8 oktober 2026', '14.30', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Laag/middel', 'Middagvoorstelling met herkenbare muziek, humor en herinneringen uit de jaren vijftig en zestig.', 'Musis & Stadstheater', sources.musis, ['matinee','muziektheater']),
  event('Go Short Arnhem 2026', '9 t/m 11 oktober 2026', 'diverse tijden', 'Cultuur & Ontdekken', 'Focus Filmtheater, Arnhem', 'Betaald', 'Middel/hoog', 'Driedaags kortfilmfestival met losse programma’s, waaronder familie, sciencefiction en regionale films.', 'Focus Filmtheater', 'https://www.focusarnhem.nl/agenda/go-short-2026-late-night-sci-fi/', ['filmfestival','kortfilm']),
  event('Margriet van der Linden – Annie, are you ok?', 'Zaterdag 10 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Solovoorstelling met stand-up, persoonlijke verhalen en scherpe observaties.', 'Musis & Stadstheater', sources.musis, ['cabaret','theater']),
  event('Pride concert', 'Zondag 11 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis, Arnhem', 'Betaald', 'Middel/hoog', 'Klassieke muziek en muziektheater rond identiteit en queer geschiedenis.', 'Musis & Stadstheater', sources.musis, ['klassiek','muziektheater']),
  event('Het Debuut 2026', 'Donderdag 15 oktober 2026', '20.30', 'Cultuur & Ontdekken', 'LUX, Nijmegen', 'Betaald', 'Middel', 'Drie korte voorstellingen van nieuw theatertalent op één avond.', 'LUX Nijmegen', 'https://www.lux-nijmegen.nl/programma/het-debuut-2026/', ['theater','talent']),
  event('Over de liefde', 'Donderdag 15 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Theatervoorstelling van Aaf Brandt Corstius en Lies Visschedijk over liefde en relaties.', 'Musis & Stadstheater', sources.musis, ['toneel','podcast']),
  event('Arnhem, mijn stadje', 'Zaterdag 17 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis, Arnhem', '€€', 'Middel/hoog', 'Muzikale rondleiding door Arnhem met orkest, zang en lokale verhalen.', 'Musis & Stadstheater', 'https://www.musisenstadstheater.nl/nl/agenda/arnhems-promenade-orkest/10074', ['orkest','arnhem']),
  event('Cinekid 2026', '17 t/m 25 oktober 2026', 'diverse tijden', 'Cultuur & Ontdekken', 'LUX, Nijmegen', 'Betaald', 'Middel', 'Film- en mediafestival met losse films en workshops voor kinderen van 3 tot 12 jaar.', 'LUX Nijmegen', 'https://www.lux-nijmegen.nl/festival/cinekid-2026/', ['film','familie','workshop']),
  event('Organ & Film Festival – Animatieplaats (6+)', '17 en 18 oktober 2026', 'zie programma', 'Creatief & Expressie', 'Stevenskerk, Nijmegen', 'Betaald', 'Middel', 'Animatie en orgelmuziek komen samen in de Stevenskerk.', 'LUX Nijmegen', 'https://www.lux-nijmegen.nl/programma/organ-film-festival-animatieplaats-6/', ['animatie','muziek','familie']),
  event('Gestrand op Mars (8+)', 'Zondag 18 oktober 2026', '14.30', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Familievoorstelling waarin nieuwsgierigheid en ruimtevaart centraal staan.', 'Musis & Stadstheater', sources.musis, ['familie','ruimtevaart']),
  event('Eva Eikhout – Het leven is kort, net als ik!', 'Maandag 19 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Theatercollege met humor, zelfspot en verhalen over veerkracht.', 'Musis & Stadstheater', sources.musis, ['theatercollege','humor']),
  event('Nederlands Blazers Ensemble – Broze Aarde', 'Dinsdag 20 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis, Arnhem', 'Betaald', 'Middel', 'Muziektheater over mens, aarde, kwetsbaarheid en hoop.', 'Musis & Stadstheater', sources.musis, ['klassiek','muziektheater']),
  event('Marcel van Roosmalen – Ik mag niet klagen', 'Dinsdag 20 oktober 2026', '20.30', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Cabaret en observaties over leven, afkomst en Arnhem.', 'Musis & Stadstheater', sources.musis, ['cabaret','arnhem']),
  event('Next to Normal', 'Woensdag 21 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Hoog', 'Intense musical over een gezin dat probeert houvast te vinden.', 'Musis & Stadstheater', sources.musis, ['musical']),
  event('Juf Braaksel De Musical (6+)', 'Donderdag 22 oktober 2026', '13.30 en 16.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel/hoog', 'Familiemusical gebaseerd op de boeken van Carry Slee.', 'Musis & Stadstheater', sources.musis, ['familie','musical']),
  event('Roodkapje (3+)', 'Vrijdag 23 oktober 2026', '11.00 en 13.30', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Muzikale familievoorstelling voor jonge kinderen.', 'Musis & Stadstheater', sources.musis, ['familie','muziek']),
  event('Eldorado', 'Vrijdag 23 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel', 'Actuele solovoorstelling over bewoners die hun vertrouwde plek proberen te behouden.', 'Musis & Stadstheater', sources.musis, ['toneel']),
  event('Folk', 'Zaterdag 24 oktober 2026', 'zie programma', 'Sport & Bewegen', 'LUX, Nijmegen', 'Betaald', 'Middel/hoog', 'Hedendaagse dansvoorstelling met veel beweging, ritme en visuele energie.', 'LUX Nijmegen', sources.lux, ['dans','podium']),
  event('Liefdesbrieven', 'Zaterdag 24 oktober 2026', '20.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Laag/middel', 'Toneel met Anne Wil Blankers en Hans Croiset rond een levenslange briefwisseling.', 'Musis & Stadstheater', sources.musis, ['toneel']),
  event('Mus & Kapitein Kwaadbaard (8+)', 'Zondag 25 oktober 2026', '13.30 en 16.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Middel/hoog', 'Muzikale familievoorstelling vol avontuur, piraten en fantasie.', 'Musis & Stadstheater', sources.musis, ['familie','muziek']),
  event('Raymond Mens – De Tussenstand in Amerika', 'Dinsdag 27 oktober 2026', '21.00', 'Cultuur & Ontdekken', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Laag/middel', 'Theatercollege over de Amerikaanse politiek richting de tussentijdse verkiezingen.', 'Musis & Stadstheater', sources.musis, ['theatercollege','actualiteit']),
  event('Energy – Introdans', '29 en 30 oktober 2026', '20.30', 'Sport & Bewegen', 'Musis & Stadstheater, Arnhem', 'Betaald', 'Hoog', 'Dansprogramma met dynamiek, contrast en hedendaagse choreografie.', 'Musis & Stadstheater', sources.musis, ['dans','arnhem']),
  event('ROOM IN OUR HOUSE', 'Vrijdag 30 oktober 2026', 'zie programma', 'Cultuur & Ontdekken', 'LUX, Nijmegen', 'Betaald', 'Middel/hoog', 'Hedendaagse podiumvoorstelling van Nicole Beutler Projects & Rematriation.', 'LUX Nijmegen', sources.lux, ['dans','podium']),
  event('Halloweenfilm – Carrie', 'Zaterdag 31 oktober 2026', 'zie programma', 'Cultuur & Ontdekken', 'LUX, Nijmegen', 'Betaald', 'Hoog', 'Speciale Halloweenvertoning van de klassieker Carrie.', 'LUX Nijmegen', sources.lux, ['film','halloween'])
];

const key = item => `${String(item.title || '').toLowerCase()}|${String(item.date || '').toLowerCase()}|${String(item.where || '').toLowerCase()}`;
const existing = new Set((data.external || []).map(key));
for(const item of launchEvents){
  if(!existing.has(key(item))) data.external.push(item);
}

data.generated = new Intl.DateTimeFormat('nl-NL', {day:'numeric', month:'long', year:'numeric', timeZone:'Europe/Amsterdam'}).format(new Date());
fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Agenda aangevuld met ${launchEvents.filter(item => !existing.has(key(item))).length} actuele najaarsitems.`);
