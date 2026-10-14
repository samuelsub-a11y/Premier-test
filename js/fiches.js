/* fiches.js — liste des fiches d'arrêts avec recherche et filtres. */

const champRecherche = document.getElementById("recherche");
const selectMatiere = document.getElementById("filtre-matiere");
const selectTheme = document.getElementById("filtre-theme");
const zoneListe = document.getElementById("liste-fiches");
const zoneNombre = document.getElementById("nombre-resultats");

let toutesLesFiches = [];

/** Liste triée et sans doublon des valeurs d'une liste. */
function valeursUniques(valeurs) {
  return [...new Set(valeurs.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
}

function remplirSelect(select, valeurs, libelleTous, valeurChoisie) {
  select.innerHTML = '<option value="">' + libelleTous + "</option>" +
    valeurs.map((v) => '<option value="' + echapper(v) + '">' + echapper(v) + "</option>").join("");
  // On garde le choix précédent s'il existe encore dans la liste.
  select.value = valeurs.includes(valeurChoisie) ? valeurChoisie : "";
}

/** Les thèmes proposés dépendent de la matière choisie. */
function mettreAJourThemes() {
  const matiere = selectMatiere.value;
  const fiches = matiere ? toutesLesFiches.filter((f) => f.matiere === matiere) : toutesLesFiches;
  remplirSelect(selectTheme, valeursUniques(fiches.flatMap((f) => f.themes || [])), "Tous les thèmes", selectTheme.value);
}

/** Tout le texte d'une fiche, sans accents, pour la recherche. */
function texteRecherchable(fiche) {
  const champs = [
    fiche.titre, fiche.intitule_complet, fiche.juridiction, fiche.date, fiche.reference,
    fiche.matiere, fiche.resume, fiche.probleme,
    [].concat(fiche.themes || [], fiche.faits || [], fiche.procedure || [],
      fiche.solution || [], fiche.portee || [], fiche.textes || []).join(" "),
  ];
  return normaliser(champs.join(" "));
}

function carteFiche(fiche) {
  const themes = (fiche.themes || [])
    .map((t) => '<li><span class="etiquette">' + echapper(t) + "</span></li>").join("");
  return (
    '<a class="carte tuile carte-fiche" href="fiche.html?id=' + encodeURIComponent(fiche.id) + '">' +
      '<div class="carte-fiche__haut">' +
        '<span class="carte-fiche__meta">' + echapper([fiche.juridiction, fiche.date].filter(Boolean).join(", ")) + "</span>" +
        (fiche.a_verifier ? badgeAVerifier() : "") +
      "</div>" +
      "<h2>" + echapper(fiche.titre) + "</h2>" +
      (fiche.resume ? "<p>" + mettreEnForme(fiche.resume) + "</p>" : "") +
      '<ul class="etiquettes">' + themes + "</ul>" +
    "</a>"
  );
}

function afficherListe() {
  const mots = normaliser(champRecherche.value).split(/\s+/).filter(Boolean);
  const matiere = selectMatiere.value;
  const theme = selectTheme.value;

  const resultats = toutesLesFiches.filter((f) => {
    if (matiere && f.matiere !== matiere) return false;
    if (theme && !(f.themes || []).includes(theme)) return false;
    const texte = f._texte;
    return mots.every((mot) => texte.includes(mot));
  });

  zoneNombre.textContent = resultats.length + (resultats.length > 1 ? " fiches trouvées" : " fiche trouvée");
  zoneListe.innerHTML = resultats.length
    ? resultats.map(carteFiche).join("")
    : '<div class="message message--info">Aucune fiche ne correspond à votre recherche. Essayez un autre mot-clé ou retirez un filtre.</div>';

  // On mémorise la recherche dans l'adresse : le bouton « retour » la retrouve.
  const params = new URLSearchParams();
  if (champRecherche.value.trim()) params.set("q", champRecherche.value.trim());
  if (matiere) params.set("matiere", matiere);
  if (theme) params.set("theme", theme);
  const query = params.toString();
  history.replaceState(null, "", query ? "?" + query : location.pathname);
}

async function demarrer() {
  try {
    const fiches = await chargerDonnees("fiches.json");
    toutesLesFiches = fiches
      .map((f) => ({ ...f, _texte: texteRecherchable(f) }))
      .sort((a, b) => (a.annee || 0) - (b.annee || 0) || String(a.titre).localeCompare(String(b.titre), "fr"));
  } catch (e) {
    afficherErreur(zoneListe, e);
    return;
  }

  // Valeurs éventuellement transmises dans l'adresse (ex. depuis une fiche).
  champRecherche.value = parametreURL("q") || "";
  remplirSelect(selectMatiere, valeursUniques(toutesLesFiches.map((f) => f.matiere)), "Toutes les matières", parametreURL("matiere"));
  selectTheme.value = "";
  mettreAJourThemes();
  const themeDemande = parametreURL("theme");
  if (themeDemande && [...selectTheme.options].some((o) => o.value === themeDemande)) selectTheme.value = themeDemande;

  champRecherche.addEventListener("input", afficherListe);
  selectMatiere.addEventListener("change", () => { mettreAJourThemes(); afficherListe(); });
  selectTheme.addEventListener("change", afficherListe);

  afficherListe();
}

demarrer();
