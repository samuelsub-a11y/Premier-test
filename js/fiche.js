/* fiche.js — affiche une fiche d'arrêt (adresse : fiche.html?id=identifiant-de-la-fiche). */

const zoneFiche = document.getElementById("fiche");

/* Rubriques affichées, dans l'ordre. */
const RUBRIQUES = [
  { cle: "faits", titre: "Faits" },
  { cle: "procedure", titre: "Procédure" },
  { cle: "probleme", titre: "Problème de droit", encadre: true },
  { cle: "solution", titre: "Solution" },
  { cle: "portee", titre: "Portée" },
];

function afficherFiche(fiche, toutes) {
  document.title = fiche.titre + " — " + document.title.split(" — ").pop();

  const themes = (fiche.themes || []).map((t) =>
    '<li><a class="etiquette" href="fiches.html?theme=' + encodeURIComponent(t) + '">' + echapper(t) + "</a></li>"
  ).join("");

  const meta = [fiche.juridiction, fiche.date, fiche.reference].filter(Boolean).map(echapper).join(" · ");

  const rubriques = RUBRIQUES
    .filter((r) => fiche[r.cle] && String(fiche[r.cle]).trim() !== "")
    .map((r) =>
      '<section class="fiche__rubrique' + (r.encadre ? " fiche__rubrique--encadre" : "") + '">' +
        "<h2>" + r.titre + "</h2>" + enParagraphes(fiche[r.cle]) +
      "</section>"
    ).join("");

  const textes = (fiche.textes && fiche.textes.length)
    ? '<section class="fiche__rubrique"><h2>Textes</h2><ul>' +
        fiche.textes.map((t) => "<li>" + mettreEnForme(t) + "</li>").join("") +
      "</ul></section>"
    : "";

  const avertissement = fiche.a_verifier
    ? '<div class="message message--alerte bandeau-verifier" role="note">' + badgeAVerifier() +
        " <span>Cette fiche n'a pas encore été relue. Vérifiez son contenu avec votre cours avant de l'apprendre.</span></div>"
    : "";

  // Fiches précédente / suivante (même ordre que la liste : par année).
  const triees = toutes.slice().sort((a, b) => (a.annee || 0) - (b.annee || 0));
  const i = triees.findIndex((f) => f.id === fiche.id);
  const prec = triees[i - 1];
  const suiv = triees[i + 1];
  const navigation =
    '<nav class="fiche__navigation pas-imprimer" aria-label="Autres fiches">' +
      (prec ? '<a href="fiche.html?id=' + encodeURIComponent(prec.id) + '">← ' + echapper(prec.titre) + "</a>" : "<span></span>") +
      (suiv ? '<a href="fiche.html?id=' + encodeURIComponent(suiv.id) + '">' + echapper(suiv.titre) + " →</a>" : "<span></span>") +
    "</nav>";

  zoneFiche.innerHTML =
    '<div class="carte fiche">' +
      '<header class="fiche__entete">' +
        '<p class="fiche__matiere">' + echapper(fiche.matiere || "") + "</p>" +
        "<h1>" + echapper(fiche.titre) + "</h1>" +
        (fiche.intitule_complet ? '<p class="fiche__intitule">' + echapper(fiche.intitule_complet) + "</p>" : "") +
        '<p class="fiche__meta">' + meta + "</p>" +
        '<ul class="etiquettes">' + themes + "</ul>" +
      "</header>" +
      avertissement +
      rubriques +
      textes +
      '<div class="groupe-boutons">' +
        '<a class="bouton" href="quiz.html?arret=' + encodeURIComponent(fiche.id) + '">S\'entraîner sur cet arrêt</a>' +
        '<button class="bouton bouton--secondaire" type="button" onclick="window.print()">Imprimer la fiche</button>' +
      "</div>" +
    "</div>" +
    navigation;
}

async function demarrer() {
  const id = parametreURL("id");
  try {
    const fiches = await chargerDonnees("fiches.json");
    const fiche = fiches.find((f) => f.id === id);
    if (!fiche) {
      zoneFiche.innerHTML = '<div class="message message--info">Cette fiche est introuvable. ' +
        '<a href="fiches.html">Retour à la liste des fiches</a>.</div>';
      return;
    }
    afficherFiche(fiche, fiches);
  } catch (e) {
    afficherErreur(zoneFiche, e);
  }
}

demarrer();
