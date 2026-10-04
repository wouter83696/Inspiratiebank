#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const {execFile} = require('node:child_process');
const {promisify} = require('node:util');

const execFileAsync = promisify(execFile);

const root = path.resolve(__dirname, '..');
const dataPath = path.join(root, 'data', 'zomerprogramma_data.json');
const imageDir = path.join(root, 'afbeeldingen', 'inspiratie');

const fallbackImages = {
  'Museum Arnhem': {
    url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/ArnhemMuseum2023.jpg?width=1600',
    sourceUrl:'https://commons.wikimedia.org/wiki/Category:Museum_Arnhem', label:'Wikimedia Commons', license:'Zie bronpagina'
  },
  'Hack42 Arnhem': {
    url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hack42_Museum_Computermuseum_Arnhem_(15109490099).png?width=1600',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Hack42_Museum_Computermuseum_Arnhem_(15109490099).png', label:'Wikimedia Commons', license:'Zie bronpagina'
  },
  'Infocentrum WO2 Nijmegen': {
    url:'https://mijngelderland.blob.core.windows.net/media/13615/interactieve-belevingswand.jpg',
    sourceUrl:'https://mijngelderland.nl/inhoud/organisaties/infocentrum-wo2', label:'Infocentrum WO2 / mijnGelderland', license:'Onbekend'
  },
  'Museum Kasteel Wijchen': {
    url:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Kasteel_Wijchen_02%2C_vooraanzicht_(zuid)_met_poortgebouw_tussen_west-_en_oostvleugel.jpg?width=1600',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Kasteel_Wijchen_02%2C_vooraanzicht_(zuid)_met_poortgebouw_tussen_west-_en_oostvleugel.jpg', label:'Wikimedia Commons', license:'CC0'
  },
  'De Ezelboer': {
    url:'https://www.deezelboer.nl/_wp_generated/wp1114e495.png',
    sourceUrl:'https://www.deezelboer.nl/ezel.html', label:'De Ezelboer', license:'Onbekend'
  },
  'Nederlands Wijnmuseum Arnhem': {
    url:'https://assets.plaece.nl/thumb/Rjt5fKtyWgBhBGtEVb1inxWoVW8Rr6DEiwMfna2YZRY/resizing_type%3Afit/width%3A960/height%3A0/gravity%3Asm/enlarge%3A0/aHR0cHM6Ly9hc3NldHMucGxhZWNlLm5sL29kcC1rYW4vaW1hZ2UvNGE2ZWEwNzlmZDI0N2E5YzQ3MDM1MmY2MWMzNWY5MWE0ZjZiNjcyOF8yMjgyNjk1MjYuanBlZw.jpeg',
    sourceUrl:'https://www.regioarnhem.com/nl/locaties/4164321636/nederlands-wijnmuseum-1', label:'Visit Arnhem / Nederlands Wijnmuseum', license:'Onbekend'
  },
  'Natuurcentrum Arnhem': {
    url:'https://natuurcentrumarnhem.nl/wp-content/uploads/2023/09/Molenplaats-Sonsbeek-september-2023-scaled-e1695110565235.jpg',
    sourceUrl:'https://www.natuurcentrumarnhem.nl/locaties/molenplaats-sonsbeek/', label:'Natuurcentrum Arnhem', license:'Onbekend'
  }
};

const fixedLocations = {
  'Zijpendaalseweg 24A, 6814 CL Arnhem': {lat:51.987662, lon:5.9021425}
};

const additions = [
  ['Museum Arnhem', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '60-150 min', '1-6', '€€', 'Laag/middel', 'Moderne en hedendaagse kunst in een overzichtelijk museum, met een vrij toegankelijke beeldentuin en uitzicht over de Rijn.', 'Bekijk vooraf welke tentoonstelling past; de tuin en het museumcafe zijn ook los en rustig te bezoeken.', 'Museum Arnhem', 'https://www.museumarnhem.nl/', 'Utrechtseweg 87, 6812 AA Arnhem', ['museum','kunst','beeldentuin','arnhem']],
  ['Eusebiuskerk Arnhem', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '90-120 min', '1-6', '€€', 'Middel/hoog', 'Ontdek de Eusebiuskerk en bekijk Arnhem vanaf de glazen balkons in de toren.', 'De lift bereikt niet alle onderdelen; grafkelders en balkons vragen traplopen en zijn niet geschikt voor iedereen.', 'Eusebiuskerk Arnhem', 'https://eusebius.nl/bezoeken/', 'Kerkplein 1, 6811 EB Arnhem', ['kerk','uitzicht','glazen balkon','geschiedenis','arnhem']],
  ['Airborne Museum Hartenstein', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '90-180 min', '1-6', '€€', 'Middel/hoog', 'Historisch museum met vaste route en meeslepende Airborne Experience. Goed voor jongeren met interesse in oorlog en techniek.', 'De Airborne Experience bevat donkerte, geluid en lichteffecten; kies eventueel alleen de rustigere museumzalen.', 'Airborne Museum Hartenstein', 'https://www.airbornemuseum.nl/', 'Utrechtseweg 232, 6862 AZ Oosterbeek', ['museum','tweede wereldoorlog','airborne','oosterbeek']],
  ['Museum Bronbeek en landgoed', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '90-180 min', '1-6', '€€', 'Laag/middel', 'Combineer het museum over koloniaal-militair verleden met een gratis audiowandeling over het rustige landgoed.', 'Museum en landgoed zijn toegankelijk; controleer vooraf of de inhoud en thematiek bij de groep passen.', 'Museum Bronbeek', 'https://www.bronbeek.nl/plan-je-bezoek', 'Velperweg 147, 6824 MB Arnhem', ['museum','landgoed','audiotour','geschiedenis','arnhem']],
  ['Kasteel Rosendael', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '120-180 min', '1-6', '€€', 'Laag/middel', 'Kasteelbezoek en groen park met vijvers, historische tuin en de verrassende bedriegertjes. Binnen en buiten zijn los te combineren.', 'Controleer rondleidingstijden; het park is ruimer geopend dan het kasteel.', 'Geldersch Landschap & Kasteelen', 'https://www.glk.nl/rosendael/kasteel-rosendael', 'Rosendael 1, 6891 DA Rozendaal', ['kasteel','park','tuin','bedriegertjes','rozendaal']],
  ['Huis Zypendaal', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '60-120 min', '1-6', '€€', 'Laag', 'Kleinschalige buitenplaats met historisch ingerichte kamers, midden in een rustig landschapspark.', 'Het huis is beperkt geopend, meestal op de eerste en derde zondag; plan vooraf.', 'Geldersch Landschap & Kasteelen', 'https://www.glk.nl/zypendaal/huis-zypendaal', 'Zijpendaalseweg 44, 6814 CL Arnhem', ['buitenplaats','historie','park','rondleiding','arnhem']],
  ['Mountain Network Arnhem', 'Sport & Bewegen', 'In de regio (10-30 km)', '90-150 min', '1-6', '€€', 'Middel/hoog', 'Probeer touwklimmen met een introductieles of ga boulderen op je eigen niveau.', 'Beginners boeken een introductie; sportkleding meenemen en materiaalhuur vooraf controleren.', 'Mountain Network Arnhem', 'https://mountain-network.nl/klimcentra/locaties/', 'Olympus 27, 6832 EL Arnhem', ['klimmen','boulderen','sport','introductie','arnhem']],
  ['Timestamp Arnhem', 'Actie & Amusement', 'In de regio (10-30 km)', '60-180 min', '2-8', '€€€', 'Hoog', 'Veel bijzondere keuzes onder een dak: pixelvloer, crazy pool, quiz room, VR escape, karaoke, arcade en lasergamen.', 'Kies vooraf een activiteit en tijdsblok; licht, geluid en groepsdruk verschillen sterk per onderdeel.', 'Timestamp Arnhem', 'https://timestamp.nl/', 'Korenmarkt 40, 6811 GW Arnhem', ['gaming','karaoke','lasergame','vr','quiz','arnhem']],
  ['Hack42 Arnhem', 'Creatief & Expressie', 'In de regio (10-30 km)', '60-150 min', '1-6', 'Gratis', 'Middel', 'Ontdek een werkplaats voor technologie, solderen, programmeren en elektronica.', 'Bezoekers zijn welkom op dinsdag- en vrijdagavond; meld een eerste bezoek eventueel vooraf aan.', 'Hack42 Hackerspace Arnhem', 'https://hack42.nl/blog/meedoen', 'Cruquiusweg 3, 6827 BL Arnhem', ['hackerspace','techniek','maken','programmeren','arnhem']],
  ['Juffrouw Jannie Arnhem', 'Creatief & Expressie', 'In de regio (10-30 km)', '120 min', '1-6', '€€', 'Laag/middel', 'Laagdrempelig schilderen, tekenen en maken met stapsgewijze begeleiding; ervaring is niet nodig.', 'Bekijk de workshopagenda of reserveer een plek bij het open atelier.', 'Juffrouw Jannie', 'https://www.juffrouwjannie.com/', 'Nicolaas Beetsstraat 18, 6824 NN Arnhem', ['workshop','schilderen','tekenen','atelier','arnhem']],
  ['Natuurcentrum Arnhem', 'Natuur & Buiten', 'In de regio (10-30 km)', '60-150 min', '1-6', 'Gratis', 'Laag', 'Kies een rustige natuuractiviteit, bezoek Molenplaats Sonsbeek of kijk bij de dieren van een Arnhemse stadsboerderij.', 'Controleer locatie en activiteitenagenda; workshops kunnen vooraf aanmelden vragen.', 'Natuurcentrum Arnhem', 'https://www.natuurcentrumarnhem.nl/locaties/molenplaats-sonsbeek/', 'Zijpendaalseweg 24A, 6814 CL Arnhem', ['natuurcentrum','stadsboerderij','dieren','sonsbeek','arnhem']],
  ['Infocentrum WO2 Nijmegen', 'Cultuur & Ontdekken', 'Dichtbij (0-10 km)', '45-90 min', '1-6', 'Gratis', 'Middel', 'Compact en gratis startpunt voor oorlogsgeschiedenis, met interactieve experience en routes naar plekken in de stad.', 'Controleer openingstijden en actuele route-opties; de inhoud kan indrukwekkend zijn.', 'Infocentrum WO2 Nijmegen', 'https://infocentrumwo2.nl/', 'Ridderstraat 27, 6511 TM Nijmegen', ['museum','tweede wereldoorlog','experience','gratis','nijmegen']],
  ['Museum voor Anatomie en Pathologie', 'Cultuur & Ontdekken', 'Dichtbij (0-10 km)', '60-120 min', '1-6', 'Gratis', 'Middel/hoog', 'Bekijk echte anatomische preparaten en ontdek hoe het menselijk lichaam in elkaar zit.', 'De collectie bevat menselijke preparaten en aangeboren afwijkingen. Bespreek vooraf of dit passend is.', 'Radboudumc', 'https://www.radboudumc.nl/afdelingen/beeldvorming/onderdelen/anatomie/museum-voor-anatomie-en-pathologie/adres-en-contact', 'Geert Grooteplein 21, 6525 EZ Nijmegen', ['anatomie','pathologie','lichaam','wetenschap','gratis']],
  ['Huis van de Nijmeegse Geschiedenis', 'Cultuur & Ontdekken', 'Dichtbij (0-10 km)', '45-90 min', '1-6', 'Gratis', 'Laag', 'Kleine gratis expositieruimte in de Mariënburgkapel met wisselende verhalen en activiteiten over Nijmegen.', 'Bekijk vooraf de actuele tentoonstelling; maandag is het Huis gesloten.', 'Huis van de Nijmeegse Geschiedenis', 'https://www.huisvandenijmeegsegeschiedenis.nl/', 'Mariënburg 26, 6511 PS Nijmegen', ['geschiedenis','expositie','gratis','kapel','nijmegen']],
  ['Museum Kasteel Wijchen', 'Cultuur & Ontdekken', 'Dichtbij (0-10 km)', '60-120 min', '1-6', '€€', 'Laag/middel', 'Ontdek duizenden jaren lokale geschiedenis in Museum Kasteel Wijchen.', 'Bekijk openingstijden en het prikkelarme voorbereidingsdocument vooraf.', 'Museum Kasteel Wijchen', 'https://www.museumwijchen.nl/', 'Kasteellaan 9, 6602 DA Wijchen', ['kasteel','museum','prikkelarm','geschiedenis','wijchen']],
  ['Kasteel Doornenburg', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '90-150 min', '1-6', '€€', 'Laag/middel', 'Een compleet middeleeuws kasteel dat zelfstandig, met mediatour of met gids bezocht kan worden.', 'Het kasteel heeft veel trappen en beperkte openingsdagen; reserveer vooraf.', 'Kasteel Doornenburg', 'https://www.kasteeldoornenburg.nl/plan-uw-bezoek/', 'Kerkstraat 27, 6686 BS Doornenburg', ['kasteel','mediatour','speurtocht','middeleeuwen','doornenburg']],
  ['Brouwerij De Hemel', 'Cultuur & Ontdekken', 'Dichtbij (0-10 km)', '90-150 min', '2-8', '€€€', 'Middel', 'Bekijk hoe speciaalbier wordt gemaakt in een monumentaal pand en sluit af met een proeverij.', 'Alleen geschikt voor volwassenen; reserveren is vereist en alcoholvrij alternatief vooraf navragen.', 'Brouwerij De Hemel', 'https://brouwerijdehemel.nl/bezoek-de-brouwerij/', 'Franseplaats 1, 6511 VS Nijmegen', ['brouwerij','rondleiding','proeverij','nijmegen']],
  ['Chocobreak Nijmegen', 'Creatief & Expressie', 'Dichtbij (0-10 km)', '90-150 min', '2-8', '€€€', 'Laag/middel', 'Maak je eigen bonbons of andere chocoladecreaties tijdens een workshop.', 'Reserveer vooraf en bespreek allergieen of dieetwensen.', 'Chocobreak / Visit Nijmegen', 'https://www.visitnijmegen.com/locaties/4027531105/chocobreak', 'Nijmegen', ['chocolade','bonbons','workshop','culinair','nijmegen']],
  ['De Ezelboer', 'Natuur & Buiten', 'In de regio (10-30 km)', '120-180 min', '2-8', '€€', 'Laag/middel', 'Bijzonder buitenuitje met rustig dierencontact en wandelen in eigen tempo met een ezel.', 'Ligt net over de grens bij Goch-Kessel; reserveer en controleer route, kleding en weersomstandigheden.', 'De Ezelboer / Visit Nijmegen', 'https://www.deezelboer.nl/ezel.html', 'Goch-Kessel, Duitsland', ['ezel','wandelen','dieren','buiten','goch']],
  ['Nederlands Wijnmuseum Arnhem', 'Cultuur & Ontdekken', 'In de regio (10-30 km)', '60-120 min', '1-6', '€€', 'Laag/middel', 'Een ongewoon museum in authentieke wijnkelders over wijnbouw, handel en geur- en smaakbeleving.', 'Controleer openingstijden en toegankelijkheid van de kelders; proeven is alleen voor volwassenen.', 'Nederlands Wijnmuseum', 'https://www.wijnmuseum.nl/', 'Velperweg 23, 6824 BC Arnhem', ['museum','wijn','kelders','proeven','arnhem']]
].map(([title, domain, distanceBand, duration, group, cost, stimulus, fit, materials, source, url, address, tags]) => ({
  title, domain, type:'Bestaand extern aanbod', locationType:'Buiten de deur', distanceBand, duration, group,
  cost, stimulus, fit, materials, source, url, address, tags
}));

function slug(value='') {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 68);
}

async function fetchMetadata(url) {
  const endpoint = new URL('https://api.microlink.io/');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('meta.image', 'true');
  endpoint.searchParams.set('filter', 'image');
  const response = await fetch(endpoint, {headers:{accept:'application/json'}});
  if (!response.ok) return '';
  const payload = await response.json();
  return payload?.data?.image?.url || payload?.data?.image || '';
}

async function downloadImage(item, number) {
  const fallback = fallbackImages[item.title];
  const imageUrl = fallback?.url || await fetchMetadata(item.url) || '';
  if (!imageUrl) return {};
  const response = await fetch(imageUrl);
  if (!response.ok) return {};
  const type = response.headers.get('content-type') || '';
  const extension = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const name = `${String(number).padStart(3,'0')}-${slug(item.title)}.${extension}`;
  const imagePath = path.join(imageDir, name);
  await fs.writeFile(imagePath, Buffer.from(await response.arrayBuffer()));
  if (extension === 'jpg') {
    const basePath = imagePath.replace(/\.jpg$/i, '');
    await Promise.all([
      execFileAsync('sips', ['-Z', '480', imagePath, '--out', `${basePath}-480.jpg`]),
      execFileAsync('sips', ['-Z', '800', imagePath, '--out', `${basePath}-800.jpg`])
    ]);
  }
  return {
    image:`website-bestanden/afbeeldingen/inspiratie/${name}`,
    imageAlt:`Foto bij ${item.title}`,
    imageStatus:'approved',
    imageSourceType:'website',
    imageSourceUrl:fallback?.sourceUrl || item.url,
    imageSourceLabel:fallback?.label || item.source,
    imageLicense:fallback?.license || 'Onbekend'
  };
}

async function geocode(address) {
  if (fixedLocations[address]) return fixedLocations[address];
  const endpoint = new URL('https://nominatim.openstreetmap.org/search');
  endpoint.searchParams.set('q', address);
  endpoint.searchParams.set('format', 'jsonv2');
  endpoint.searchParams.set('limit', '1');
  endpoint.searchParams.set('countrycodes', address.includes('Duitsland') ? 'de' : 'nl');
  const response = await fetch(endpoint, {headers:{'user-agent':'BCJN-Inspiratiebank/1.0 (regional-offer-enrichment)'}});
  if (!response.ok) return {};
  const [match] = await response.json();
  return match ? {lat:Number(match.lat), lon:Number(match.lon)} : {};
}

async function main() {
  const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  const known = new Map((data.inspiration || []).map((item, index) => [item.title.toLowerCase(), index]));
  let number = (data.inspiration || []).length + 1;
  for (const item of additions) {
    const existingIndex = known.get(item.title.toLowerCase());
    if (existingIndex !== undefined) {
      const existing = data.inspiration[existingIndex];
      const [location, image] = await Promise.all([
        geocode(item.address),
        fallbackImages[item.title] || !existing.image ? downloadImage(item, existingIndex + 1) : Promise.resolve({})
      ]);
      data.inspiration[existingIndex] = {...existing, address:item.address, url:item.url, ...location, ...image};
      console.log(`${existingIndex + 1}: ${item.title}${image.image ? ' + gecontroleerde foto' : ''}`);
      continue;
    }
    const [location, image] = await Promise.all([geocode(item.address), downloadImage(item, number)]);
    data.inspiration.push({...item, ...location, ...image});
    known.set(item.title.toLowerCase(), data.inspiration.length - 1);
    console.log(`${number}: ${item.title}${image.image ? ' + foto' : ' (zonder foto)'}`);
    number += 1;
  }
  data.generated = new Intl.DateTimeFormat('nl-NL', {day:'numeric', month:'long', year:'numeric'}).format(new Date());
  await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
