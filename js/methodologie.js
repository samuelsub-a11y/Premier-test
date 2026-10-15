/* methodologie.js — sommaire des méthodes, ou une méthode (methodologie.html?id=commentaire). */

const zoneMethodo = document.getElementById("methodologie");

function afficherSommaire(methodes) {
  zoneMethodo.innerHTML =
    "<h1>Méthodologie</h1>" +
    '<p class="texte-doux">Les exercices juridiques obéissent à des règles précises. Voici les étapes et les pièges à éviter pour chacun.</p>' +
    '<div class="grille">' +
      methodes.map((m) =>
        '<a class="carte tuile" href="methodologie.html?id=' + encodeURIComponent(m.id) + '">' +
          '<div class="carte-fiche__haut"><h2>' + echapper(m.titre) + "</h2>" + (m.a_verifier ? badgeAVerifier() : "") + "</div>" +
          "<p>" + mettreEnForme(m.resume || "") + "</p>" +
        "</a>"
      ).join("") +
    "</div>";
}

function afficherMethode(methode, methodes) {
  document.title = methode.titre + " — " + document.title.split(" — ").pop();

  const sommaire = (methode.sections || []).map((s, i) =>
    '<li><a href="#section-' + (i + 1) + '">' + echapper(s.titre) + "</a></li>"
  ).join("");

  const sections = (methode.sections || []).map((s, i) =>
    '<section class="methode__section" id="section-' + (i + 1) + '">' +
      "<h2>" + echapper(s.titre) + "</h2>" +
      (s.texte ? enParagraphes(s.texte) : "") +
      (s.liste ? "<ul>" + s.liste.map((l) => "<li>" + mettreEnForme(l) + "</li>").join("") + "</ul>" : "") +
      (s.conseil ? '<div class="message message--info methode__conseil"><strong>Conseil</strong>' + enParagraphes(s.conseil) + "</div>" : "") +
      (s.exemple ? '<div class="message methode__exemple"><strong>Exemple</strong>' + enParagraphes(s.exemple) + "</div>" : "") +
    "</section>"
  ).join("");

  const autres = methodes.filter((m) => m.id !== methode.id).map((m) =>
    '<a class="bouton bouton--secondaire bouton--petit" href="methodologie.html?id=' + encodeURIComponent(m.id) + '">' + echapper(m.titre) + "</a>"
  ).join("");

  zoneMethodo.innerHTML =
    '<p class="fil-ariane pas-imprimer"><a href="methodologie.html">← Méthodologie</a></p>' +
    '<article class="carte fiche">' +
      "<h1>" + echapper(methode.titre) + "</h1>" +
      (methode.resume ? '<p class="fiche__intitule">' + mettreEnForme(methode.resume) + "</p>" : "") +
      (methode.a_verifier
        ? '<div class="message message--alerte bandeau-verifier" role="note">' + badgeAVerifier() +
            " <span>Cette page n'a pas encore été relue.</span></div>"
        : "") +
      '<nav class="methode__sommaire pas-imprimer" aria-label="Sommaire"><strong>Sommaire</strong><ol>' + sommaire + "</ol></nav>" +
      sections +
    "</article>" +
    (autres ? '<div class="groupe-boutons pas-imprimer"><span class="texte-doux">Voir aussi :</span> ' + autres + "</div>" : "");
}

async function demarrer() {
  try {
    const methodes = await chargerDonnees("methodologie.json");
    const id = parametreURL("id");
    if (!id) return afficherSommaire(methodes);
    const methode = methodes.find((m) => m.id === id);
    if (methode) afficherMethode(methode, methodes);
    else afficherSommaire(methodes);
  } catch (e) {
    afficherErreur(zoneMethodo, e);
  }
}

demarrer();
