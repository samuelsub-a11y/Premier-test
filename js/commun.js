/* ==========================================================
   commun.js — code partagé par toutes les pages du site :
   en-tête, menu, pied de page, lecture des fichiers JSON.
   Vous n'avez normalement pas besoin de modifier ce fichier.
   ========================================================== */

/* Entrées du menu principal (ordre d'affichage). */
const PAGES_DU_MENU = [
  { cle: "accueil", href: "index.html", libelle: "Accueil" },
  { cle: "fiches", href: "fiches.html", libelle: "Fiches d'arrêts" },
  { cle: "quiz", href: "quiz.html", libelle: "Quiz" },
  { cle: "flashcards", href: "flashcards.html", libelle: "Flashcards" },
  { cle: "methodologie", href: "methodologie.html", libelle: "Méthodologie" },
  { cle: "cours", href: "cours-particuliers.html", libelle: "Cours particuliers", accent: true },
];

/* ---------- Lecture des fichiers du dossier donnees/ ---------- */

/**
 * Charge un fichier JSON du dossier donnees/ et renvoie son contenu.
 * En cas de problème, renvoie une erreur expliquée en français.
 */
async function chargerDonnees(nomFichier) {
  const chemin = "donnees/" + nomFichier;
  let reponse;
  try {
    reponse = await fetch(chemin, { cache: "no-cache" });
  } catch (e) {
    throw new Error(
      "Impossible de lire le fichier « " + chemin + " ». " +
      "Si vous avez ouvert la page en double-cliquant dessus, c'est normal : " +
      "le site doit être consulté en ligne ou via un petit serveur local (voir GUIDE.md, partie « Tester le site »)."
    );
  }
  if (!reponse.ok) {
    throw new Error("Fichier introuvable : « " + chemin + " » (erreur " + reponse.status + ").");
  }
  const texte = await reponse.text();
  try {
    return JSON.parse(texte);
  } catch (e) {
    throw new Error(
      "Le fichier « " + chemin + " » contient une erreur d'écriture (" + e.message + "). " +
      "Vérifiez les virgules, les guillemets et les crochets autour de votre dernière modification. " +
      "La page verification.html peut vous aider à trouver l'erreur."
    );
  }
}

/* ---------- Petits outils de mise en forme ---------- */

/** Empêche le texte d'être interprété comme du code HTML. */
function echapper(texte) {
  return String(texte ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/** Échappe le texte puis transforme **ceci** en gras. */
function mettreEnForme(texte) {
  return echapper(texte).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** Accepte un texte ou une liste de textes et renvoie des paragraphes HTML. */
function enParagraphes(valeur) {
  const liste = Array.isArray(valeur) ? valeur : [valeur];
  return liste
    .filter((p) => p !== undefined && p !== null && String(p).trim() !== "")
    .map((p) => "<p>" + mettreEnForme(p) + "</p>")
    .join("");
}

/** Met en minuscules et retire les accents (pour la recherche). */
function normaliser(texte) {
  return String(texte ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Lit un paramètre dans l'adresse de la page (ex. fiche.html?id=costa-enel). */
function parametreURL(nom) {
  return new URLSearchParams(window.location.search).get(nom);
}

/** Mélange une liste (algorithme de Fisher-Yates). */
function melanger(liste) {
  const copie = liste.slice();
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/** Badge orange « À VÉRIFIER ». */
function badgeAVerifier() {
  return '<span class="badge-verifier" title="Contenu en attente de relecture">À VÉRIFIER</span>';
}

/** Affiche un message d'erreur lisible dans un bloc de la page. */
function afficherErreur(conteneur, erreur) {
  conteneur.innerHTML =
    '<div class="message message--erreur" role="alert"><strong>Oups, un problème est survenu.</strong>' +
    "<p>" + echapper(erreur.message || erreur) + "</p></div>";
}

/* ---------- En-tête et pied de page ---------- */

function construireEntete() {
  const entete = document.getElementById("entete");
  if (!entete) return;
  const pageActive = document.body.dataset.page;

  const liens = PAGES_DU_MENU.map((p) => {
    const classes = ["menu__lien"];
    if (p.accent) classes.push("menu__lien--accent");
    const actif = p.cle === pageActive ? ' aria-current="page"' : "";
    return '<li><a class="' + classes.join(" ") + '" href="' + p.href + '"' + actif + ">" + p.libelle + "</a></li>";
  }).join("");

  entete.innerHTML =
    '<a class="lien-evitement" href="#contenu">Aller au contenu</a>' +
    '<div class="entete__barre conteneur">' +
      '<a class="entete__logo" href="index.html">' +
        '<span class="entete__logo-icone" aria-hidden="true">§</span>' +
        '<span data-nom-site>Révisions de droit</span>' +
      "</a>" +
      '<button class="entete__bouton-menu" type="button" aria-expanded="false" aria-controls="menu-principal">' +
        '<span class="entete__bouton-icone" aria-hidden="true"></span>Menu' +
      "</button>" +
      '<nav id="menu-principal" class="menu" aria-label="Menu principal"><ul class="menu__liste">' + liens + "</ul></nav>" +
    "</div>";

  const bouton = entete.querySelector(".entete__bouton-menu");
  bouton.addEventListener("click", () => {
    const ouvert = bouton.getAttribute("aria-expanded") === "true";
    bouton.setAttribute("aria-expanded", String(!ouvert));
    entete.classList.toggle("entete--menu-ouvert", !ouvert);
  });
}

function construirePied() {
  const pied = document.getElementById("pied");
  if (!pied) return;
  pied.innerHTML =
    '<div class="conteneur pied__contenu">' +
      '<p><strong data-nom-site>Révisions de droit</strong> — <span data-slogan></span></p>' +
      '<p class="pied__avertissement">Contenus de révision rédigés par un étudiant : ils ne remplacent pas vos cours. ' +
      "Les éléments marqués «\u00a0À VÉRIFIER\u00a0» sont en cours de relecture.</p>" +
      '<p><a href="cours-particuliers.html">Cours particuliers</a> · <a href="methodologie.html">Méthodologie</a></p>' +
    "</div>";
}

/** Remplace le nom et le slogan du site par ceux de donnees/site.json. */
async function appliquerInfosSite() {
  try {
    const site = await chargerDonnees("site.json");
    document.querySelectorAll("[data-nom-site]").forEach((el) => { el.textContent = site.nom_du_site; });
    document.querySelectorAll("[data-slogan]").forEach((el) => { el.textContent = site.slogan; });
    // Le titre de l'onglet se termine par le nom du site.
    document.title = document.title.replace(/Révisions de droit$/, site.nom_du_site);
  } catch (e) {
    // Sans site.json, on garde les textes par défaut : rien de bloquant.
  }
}

construireEntete();
construirePied();
appliquerInfosSite();
