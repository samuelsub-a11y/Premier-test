/* flashcards.js — flashcards avec répétition espacée (système de Leitner à 5 boîtes).
   La progression est enregistrée dans le navigateur (localStorage). */

const CLE_STOCKAGE = "revisions-droit-flashcards-v1";
/* Nombre de jours avant de revoir une carte, selon sa boîte. */
const INTERVALLES_JOURS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
const BOITE_MAX = 5;

const zone = document.getElementById("flashcards");

let toutesLesCartes = [];
let progression = {};          // identifiant de carte -> { boite, prochaine: "AAAA-MM-JJ" }
let stockageDisponible = true;
let matiereChoisie = "";

// Session en cours
let fileAttente = [];
let modeLibre = false;
let nbRevisees = 0;

/* ---------- Dates (au jour près) ---------- */

function formaterDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const jj = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + jj;
}
function aujourdhui() { return formaterDate(new Date()); }
function dansNJours(n) { const d = new Date(); d.setDate(d.getDate() + n); return formaterDate(d); }

/* ---------- Enregistrement dans le navigateur ---------- */

function lireProgression() {
  try {
    return JSON.parse(localStorage.getItem(CLE_STOCKAGE)) || {};
  } catch (e) {
    stockageDisponible = false;
    return {};
  }
}

function enregistrerProgression() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(progression));
  } catch (e) {
    stockageDisponible = false;
  }
}

/* ---------- État des cartes ---------- */

function estNouvelle(carte) { return !progression[carte.id]; }
function boiteDe(carte) { return estNouvelle(carte) ? 0 : progression[carte.id].boite; }
function estDue(carte) { return estNouvelle(carte) || progression[carte.id].prochaine <= aujourdhui(); }

function cartesDeLaMatiere() {
  return matiereChoisie ? toutesLesCartes.filter((c) => c.matiere === matiereChoisie) : toutesLesCartes;
}

/* ---------- Tableau de bord ---------- */

function afficherTableauDeBord() {
  const cartes = cartesDeLaMatiere();
  const dues = cartes.filter(estDue);
  const nouvelles = cartes.filter(estNouvelle);
  const maitrisees = cartes.filter((c) => boiteDe(c) === BOITE_MAX);
  const matieres = [...new Set(toutesLesCartes.map((c) => c.matiere).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

  const parBoite = [0, 1, 2, 3, 4, 5].map((b) => cartes.filter((c) => boiteDe(c) === b).length);
  const maxBoite = Math.max(1, ...parBoite);
  const colonnes = parBoite.map((n, b) =>
    '<div class="boites__colonne">' +
      '<span class="boites__nombre">' + n + "</span>" +
      '<div class="boites__barre"><div style="height:' + Math.round((n / maxBoite) * 100) + '%" class="boites__remplissage boites__remplissage--' + b + '"></div></div>' +
      '<span class="boites__libelle">' + (b === 0 ? "Nouv." : "Boîte " + b) + "</span>" +
    "</div>"
  ).join("");

  const alerteStockage = stockageDisponible ? "" :
    '<div class="message message--alerte">Votre navigateur bloque l\'enregistrement (navigation privée ?). ' +
    "Vous pouvez réviser, mais votre progression ne sera pas conservée.</div>";

  zone.innerHTML =
    alerteStockage +
    '<div class="carte">' +
      (matieres.length > 1
        ? '<label for="fc-matiere">Matière</label><select id="fc-matiere"><option value="">Toutes les matières</option>' +
            matieres.map((m) => '<option value="' + echapper(m) + '">' + echapper(m) + "</option>").join("") +
          "</select>"
        : "") +
      '<div class="stats">' +
        '<div class="stats__case"><span class="stats__valeur">' + dues.length + '</span><span class="stats__libelle">à réviser aujourd\'hui</span></div>' +
        '<div class="stats__case"><span class="stats__valeur">' + nouvelles.length + '</span><span class="stats__libelle">nouvelles</span></div>' +
        '<div class="stats__case"><span class="stats__valeur">' + maitrisees.length + " / " + cartes.length + '</span><span class="stats__libelle">maîtrisées</span></div>' +
      "</div>" +
      '<div class="boites" aria-label="Répartition des cartes par boîte">' + colonnes + "</div>" +
      (dues.length
        ? '<button class="bouton bouton--large" id="fc-commencer" type="button">Réviser les ' + dues.length + " carte" + (dues.length > 1 ? "s" : "") + " du jour</button>"
        : '<div class="message message--succes">Rien à réviser aujourd\'hui : revenez demain !</div>') +
      '<div class="groupe-boutons">' +
        (cartes.length ? '<button class="bouton bouton--secondaire bouton--petit" id="fc-tout" type="button">Réviser toutes les cartes</button>' : "") +
        '<button class="bouton bouton--secondaire bouton--petit" id="fc-reinitialiser" type="button">Réinitialiser ma progression</button>' +
      "</div>" +
    "</div>";

  const select = document.getElementById("fc-matiere");
  if (select) {
    select.value = matiereChoisie;
    select.addEventListener("change", () => { matiereChoisie = select.value; afficherTableauDeBord(); });
  }
  const boutonCommencer = document.getElementById("fc-commencer");
  if (boutonCommencer) boutonCommencer.addEventListener("click", () => demarrerSession(false));
  const boutonTout = document.getElementById("fc-tout");
  if (boutonTout) boutonTout.addEventListener("click", () => demarrerSession(true));
  document.getElementById("fc-reinitialiser").addEventListener("click", () => {
    if (confirm("Effacer toute votre progression sur les flashcards ? Cette action est définitive.")) {
      progression = {};
      enregistrerProgression();
      afficherTableauDeBord();
    }
  });
}

/* ---------- Session de révision ---------- */

function demarrerSession(toutes) {
  modeLibre = toutes;
  nbRevisees = 0;
  const cartes = toutes ? cartesDeLaMatiere() : cartesDeLaMatiere().filter(estDue);
  // Les cartes déjà commencées d'abord (boîtes basses en premier), puis les nouvelles.
  const commencees = melanger(cartes.filter((c) => !estNouvelle(c))).sort((a, b) => boiteDe(a) - boiteDe(b));
  const nouvelles = melanger(cartes.filter(estNouvelle));
  fileAttente = commencees.concat(nouvelles);
  afficherCarte();
}

function afficherCarte() {
  if (!fileAttente.length) {
    afficherFinSession();
    return;
  }
  const carte = fileAttente[0];
  const boite = boiteDe(carte);

  zone.innerHTML =
    '<div class="session__haut">' +
      "<span>" + fileAttente.length + " carte" + (fileAttente.length > 1 ? "s" : "") + " restante" + (fileAttente.length > 1 ? "s" : "") + "</span>" +
      '<button class="bouton bouton--secondaire bouton--petit" id="fc-arreter" type="button">Arrêter</button>' +
    "</div>" +
    '<div class="flashcard carte">' +
      '<div class="flashcard__haut">' +
        '<span class="flashcard__theme">' + echapper(carte.theme || carte.matiere || "") + "</span>" +
        "<span>" + (carte.a_verifier ? badgeAVerifier() + " " : "") +
          '<span class="flashcard__boite">' + (boite === 0 ? "Nouvelle" : "Boîte " + boite) + "</span></span>" +
      "</div>" +
      '<div class="flashcard__recto">' + enParagraphes(carte.recto) + "</div>" +
      '<div class="flashcard__verso masque" id="fc-verso">' + enParagraphes(carte.verso) +
        (carte.arret ? '<p class="flashcard__lien"><a href="fiche.html?id=' + encodeURIComponent(carte.arret) + '">Voir la fiche de l\'arrêt</a></p>' : "") +
      "</div>" +
    "</div>" +
    '<div id="fc-actions">' +
      '<button class="bouton bouton--large" id="fc-retourner" type="button">Afficher la réponse</button>' +
    "</div>";

  document.getElementById("fc-arreter").addEventListener("click", afficherFinSession);
  const retourner = document.getElementById("fc-retourner");
  retourner.focus();
  retourner.addEventListener("click", () => {
    document.getElementById("fc-verso").classList.remove("masque");
    document.getElementById("fc-actions").innerHTML =
      '<div class="groupe-boutons groupe-boutons--egal">' +
        '<button class="bouton bouton--erreur" id="fc-revoir" type="button">À revoir</button>' +
        '<button class="bouton bouton--succes" id="fc-savais" type="button">Je savais</button>' +
      "</div>";
    document.getElementById("fc-savais").focus();
    document.getElementById("fc-revoir").addEventListener("click", () => repondre(carte, false));
    document.getElementById("fc-savais").addEventListener("click", () => repondre(carte, true));
  });
}

function repondre(carte, savait) {
  fileAttente.shift();
  nbRevisees++;

  if (savait) {
    // En révision libre, une carte pas encore « due » garde sa boîte et sa date.
    if (estDue(carte)) {
      const boite = Math.min((estNouvelle(carte) ? 1 : progression[carte.id].boite) + 1, BOITE_MAX);
      progression[carte.id] = { boite, prochaine: dansNJours(INTERVALLES_JOURS[boite]) };
    }
  } else {
    progression[carte.id] = { boite: 1, prochaine: aujourdhui() };
    fileAttente.push(carte);   // la carte ratée revient en fin de session
  }
  enregistrerProgression();
  afficherCarte();
}

function afficherFinSession() {
  zone.innerHTML =
    '<div class="carte centre">' +
      "<h2>Session terminée</h2>" +
      "<p>" + nbRevisees + " réponse" + (nbRevisees > 1 ? "s" : "") + " donnée" + (nbRevisees > 1 ? "s" : "") +
        (modeLibre ? " en révision libre." : ".") + " Votre progression est enregistrée.</p>" +
      '<button class="bouton" id="fc-retour" type="button">Retour au tableau de bord</button>' +
    "</div>";
  document.getElementById("fc-retour").addEventListener("click", afficherTableauDeBord);
}

/* ---------- Démarrage ---------- */

async function demarrer() {
  try {
    toutesLesCartes = await chargerDonnees("flashcards.json");
  } catch (e) {
    afficherErreur(zone, e);
    return;
  }
  progression = lireProgression();
  afficherTableauDeBord();
}

demarrer();
