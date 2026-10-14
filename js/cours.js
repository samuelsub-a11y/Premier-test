/* cours.js — page « Cours particuliers », remplie à partir de donnees/cours-particuliers.json. */

const zoneCours = document.getElementById("cours");

/** Comme mettreEnForme, mais surligne les passages [À COMPLÉTER …]. */
function formaterCours(texte) {
  return mettreEnForme(texte).replace(/\[À COMPLÉTER[^\]]*\]/g, '<mark class="a-completer">$&</mark>');
}

function liste(titre, elements) {
  if (!elements || !elements.length) return "";
  return "<section><h2>" + echapper(titre) + '</h2><ul class="liste-coches">' +
    elements.map((e) => "<li>" + formaterCours(e) + "</li>").join("") + "</ul></section>";
}

function afficherCours(c) {
  const contact = c.contact || {};
  const adresseExemple = !contact.email || /exemple/i.test(contact.email);
  const lienMail = "mailto:" + (contact.email || "") +
    (contact.objet_du_mail ? "?subject=" + encodeURIComponent(contact.objet_du_mail) : "");

  const tarifs = (c.tarifs || []).map((t) =>
    '<div class="carte tarif">' +
      '<h3 class="tarif__formule">' + echapper(t.formule) + "</h3>" +
      (t.duree ? '<p class="tarif__duree">' + echapper(t.duree) + "</p>" : "") +
      '<p class="tarif__prix">' + formaterCours(t.prix) + "</p>" +
      (t.detail ? '<p class="tarif__detail">' + formaterCours(t.detail) + "</p>" : "") +
    "</div>"
  ).join("");

  const boutons =
    (contact.email ? '<a class="bouton bouton--accent" href="' + echapper(lienMail) + '">' + echapper(contact.texte_du_bouton || "Me contacter") + "</a>" : "") +
    (contact.lien_formulaire
      ? '<a class="bouton bouton--secondaire bouton--clair" href="' + echapper(contact.lien_formulaire) + '" target="_blank" rel="noopener">' +
          echapper(contact.texte_du_bouton_formulaire || "Formulaire de contact") + "</a>"
      : "");

  zoneCours.innerHTML =
    '<section class="accueil-intro">' +
      "<h1>" + echapper(c.titre || "Cours particuliers") + "</h1>" +
      (c.accroche ? '<p class="texte-doux">' + formaterCours(c.accroche) + "</p>" : "") +
      '<a class="bouton bouton--accent" href="#contact">Prendre contact</a>' +
    "</section>" +
    (c.presentation ? "<section><h2>Qui suis-je ?</h2>" + [].concat(c.presentation).map((p) => "<p>" + formaterCours(p) + "</p>").join("") + "</section>" : "") +
    liste("Pour qui ?", c.public) +
    liste("Matières proposées", c.matieres) +
    liste("Déroulement", c.deroulement) +
    (tarifs ? '<section><h2>Tarifs</h2><div class="grille grille--tarifs">' + tarifs + "</div></section>" : "") +
    '<section id="contact" class="bandeau-cours">' +
      "<h2>Me contacter</h2>" +
      (contact.texte ? "<p>" + formaterCours(contact.texte) + "</p>" : "") +
      (contact.email ? '<p class="contact__email">' + echapper(contact.email) + "</p>" : "") +
      (adresseExemple
        ? '<p class="message message--alerte">Adresse e-mail à remplacer dans le fichier donnees/cours-particuliers.json.</p>'
        : "") +
      '<div class="groupe-boutons">' + boutons + "</div>" +
    "</section>";
}

async function demarrer() {
  try {
    afficherCours(await chargerDonnees("cours-particuliers.json"));
  } catch (e) {
    afficherErreur(zoneCours, e);
  }
}

demarrer();
