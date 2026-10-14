/* verification.js — contrôle le contenu des fichiers du dossier donnees/. */

const zoneVerif = document.getElementById("verification");

/** Lit un fichier et indique la ligne de l'erreur d'écriture s'il y en a une. */
async function lireFichier(nom) {
  const chemin = "donnees/" + nom;
  let texte;
  try {
    const reponse = await fetch(chemin, { cache: "no-cache" });
    if (!reponse.ok) return { erreur: "Fichier introuvable (erreur " + reponse.status + ")." };
    texte = await reponse.text();
  } catch (e) {
    return { erreur: "Impossible de lire le fichier. La page doit être ouverte en ligne ou via un serveur local (voir GUIDE.md)." };
  }
  try {
    return { donnees: JSON.parse(texte) };
  } catch (e) {
    let ligne = "";
    const position = /position (\d+)/.exec(e.message);
    const ligneDirecte = /line (\d+)/.exec(e.message);
    if (ligneDirecte) ligne = ligneDirecte[1];
    else if (position) ligne = texte.slice(0, Number(position[1])).split("\n").length;
    return {
      erreur: "Erreur d'écriture" + (ligne ? " vers la ligne " + ligne : "") +
        ". Causes fréquentes : virgule manquante entre deux blocs, virgule en trop après le dernier élément, " +
        "guillemet non fermé ou guillemet droit (\") utilisé dans un texte (utilisez « » à la place). " +
        "Détail technique : " + e.message,
    };
  }
}

function estTexteRempli(v) {
  if (Array.isArray(v)) return v.some((x) => String(x || "").trim() !== "");
  return typeof v === "string" && v.trim() !== "";
}

/** Contrôles communs : liste, identifiants présents, uniques et bien formés. */
function verifierIdentifiants(liste, nomElement, erreurs, avertissements) {
  if (!Array.isArray(liste)) {
    erreurs.push("Le fichier doit commencer par [ et finir par ] (c'est une liste).");
    return false;
  }
  const vus = new Set();
  liste.forEach((el, i) => {
    const ref = nomElement + " n° " + (i + 1);
    if (!el || typeof el !== "object") { erreurs.push(ref + " : ce n'est pas un bloc { … } valide."); return; }
    if (!estTexteRempli(el.id)) { erreurs.push(ref + " : il manque l'identifiant (\"id\")."); return; }
    if (vus.has(el.id)) erreurs.push(ref + " : l'identifiant « " + el.id + " » est déjà utilisé. Chaque identifiant doit être unique.");
    vus.add(el.id);
    if (!/^[a-z0-9-]+$/.test(el.id)) {
      avertissements.push(ref + " : l'identifiant « " + el.id + " » devrait contenir uniquement des minuscules sans accent, des chiffres et des tirets.");
    }
  });
  return true;
}

function verifierFiches(fiches, erreurs, avertissements) {
  if (!verifierIdentifiants(fiches, "Fiche", erreurs, avertissements)) return;
  fiches.forEach((f, i) => {
    const ref = "Fiche « " + (f.titre || f.id || "n° " + (i + 1)) + " »";
    ["titre", "matiere", "faits", "procedure", "probleme", "solution", "portee"].forEach((champ) => {
      if (!estTexteRempli(f[champ])) erreurs.push(ref + " : le champ « " + champ + " » est vide ou absent.");
    });
    if (f.themes !== undefined && !Array.isArray(f.themes)) erreurs.push(ref + " : « themes » doit être une liste entre crochets, ex. [\"Primauté\"].");
    if (!f.themes || !f.themes.length) avertissements.push(ref + " : aucun thème (le filtre par thème ne la trouvera pas).");
    if (f.annee !== undefined && typeof f.annee !== "number") avertissements.push(ref + " : « annee » doit être un nombre sans guillemets, ex. 1964.");
    if (typeof f.a_verifier !== "boolean") avertissements.push(ref + " : « a_verifier » doit valoir true ou false (sans guillemets).");
  });
}

function verifierQuiz(questions, idsFiches, erreurs, avertissements) {
  if (!verifierIdentifiants(questions, "Question", erreurs, avertissements)) return;
  questions.forEach((q, i) => {
    const ref = "Question « " + (q.id || "n° " + (i + 1)) + " »";
    if (!estTexteRempli(q.question)) erreurs.push(ref + " : le texte de la question est vide.");
    if (q.type === "qcm") {
      if (!Array.isArray(q.choix) || q.choix.length < 2) erreurs.push(ref + " : un QCM doit avoir au moins 2 choix dans « choix ».");
      else if (!Number.isInteger(q.bonne_reponse) || q.bonne_reponse < 1 || q.bonne_reponse > q.choix.length) {
        erreurs.push(ref + " : « bonne_reponse » doit être un nombre entre 1 et " + q.choix.length + " (1 = premier choix).");
      }
    } else if (q.type === "solution") {
      if (!estTexteRempli(q.reponse)) erreurs.push(ref + " : une question « solution » doit avoir une « reponse ».");
    } else {
      erreurs.push(ref + " : « type » doit valoir \"qcm\" ou \"solution\".");
    }
    if (!estTexteRempli(q.explication)) avertissements.push(ref + " : pas d'« explication » (conseillée pour la correction).");
    if (!estTexteRempli(q.matiere)) avertissements.push(ref + " : pas de « matiere » (le filtre par matière ne la trouvera pas).");
    if (q.arret && idsFiches && !idsFiches.has(q.arret)) avertissements.push(ref + " : « arret » vaut « " + q.arret + " », mais aucune fiche n'a cet identifiant.");
  });
}

function verifierFlashcards(cartes, idsFiches, erreurs, avertissements) {
  if (!verifierIdentifiants(cartes, "Flashcard", erreurs, avertissements)) return;
  cartes.forEach((c, i) => {
    const ref = "Flashcard « " + (c.id || "n° " + (i + 1)) + " »";
    if (!estTexteRempli(c.recto)) erreurs.push(ref + " : le « recto » est vide.");
    if (!estTexteRempli(c.verso)) erreurs.push(ref + " : le « verso » est vide.");
    if (c.arret && idsFiches && !idsFiches.has(c.arret)) avertissements.push(ref + " : « arret » vaut « " + c.arret + " », mais aucune fiche n'a cet identifiant.");
  });
}

function verifierMethodologie(methodes, erreurs, avertissements) {
  if (!verifierIdentifiants(methodes, "Méthode", erreurs, avertissements)) return;
  methodes.forEach((m, i) => {
    const ref = "Méthode « " + (m.titre || m.id || "n° " + (i + 1)) + " »";
    if (!estTexteRempli(m.titre)) erreurs.push(ref + " : le « titre » est vide.");
    if (!Array.isArray(m.sections) || !m.sections.length) erreurs.push(ref + " : « sections » doit être une liste non vide.");
    else m.sections.forEach((s, j) => {
      if (!estTexteRempli(s.titre)) erreurs.push(ref + ", section n° " + (j + 1) + " : le « titre » est vide.");
    });
  });
}

function verifierCours(cours, erreurs, avertissements) {
  if (!cours || typeof cours !== "object" || Array.isArray(cours)) {
    erreurs.push("Le fichier doit commencer par { et finir par }.");
    return;
  }
  const contact = cours.contact || {};
  if (!estTexteRempli(contact.email) && !estTexteRempli(contact.lien_formulaire)) erreurs.push("Aucun moyen de contact : remplissez « email » ou « lien_formulaire ».");
  if (/exemple/i.test(contact.email || "")) avertissements.push("L'adresse e-mail est encore l'adresse d'exemple.");
  const nb = (JSON.stringify(cours).match(/À COMPLÉTER/g) || []).length;
  if (nb) avertissements.push(nb + " passage" + (nb > 1 ? "s" : "") + " « [À COMPLÉTER] » reste" + (nb > 1 ? "nt" : "") + " à remplir.");
}

function compterAVerifier(liste) {
  return Array.isArray(liste) ? liste.filter((el) => el && el.a_verifier === true).length : 0;
}

function blocResultat(nom, resultat, erreurs, avertissements, info) {
  let etat = "succes";
  if (resultat.erreur || erreurs.length) etat = "erreur";
  else if (avertissements.length) etat = "alerte";
  const icones = { succes: "✓", alerte: "!", erreur: "✗" };
  const lignes = [];
  if (resultat.erreur) lignes.push('<li class="verif__erreur">' + echapper(resultat.erreur) + "</li>");
  erreurs.forEach((e) => lignes.push('<li class="verif__erreur">' + echapper(e) + "</li>"));
  avertissements.forEach((a) => lignes.push('<li class="verif__alerte">' + echapper(a) + "</li>"));
  return (
    '<section class="carte verif verif--' + etat + '">' +
      '<h2><span class="verif__icone">' + icones[etat] + "</span> " + echapper(nom) + "</h2>" +
      (info ? '<p class="texte-doux">' + info + "</p>" : "") +
      (lignes.length ? "<ul>" + lignes.join("") + "</ul>" : "<p>Aucun problème détecté.</p>") +
    "</section>"
  );
}

async function demarrer() {
  const noms = ["site.json", "fiches.json", "quiz.json", "flashcards.json", "methodologie.json", "cours-particuliers.json"];
  const res = {};
  await Promise.all(noms.map(async (n) => { res[n] = await lireFichier(n); }));

  const fiches = res["fiches.json"].donnees;
  const idsFiches = Array.isArray(fiches) ? new Set(fiches.map((f) => f && f.id)) : null;

  const blocs = [];
  let totalErreurs = 0;

  function controler(nom, fonction, info) {
    const erreurs = [];
    const avertissements = [];
    if (!res[nom].erreur && fonction) fonction(res[nom].donnees, erreurs, avertissements);
    totalErreurs += erreurs.length + (res[nom].erreur ? 1 : 0);
    blocs.push(blocResultat(nom, res[nom], erreurs, avertissements, res[nom].erreur ? "" : info));
  }

  const nb = (n) => (Array.isArray(res[n].donnees) ? res[n].donnees.length : 0);

  controler("site.json", (d, e) => { if (!d || !estTexteRempli(d.nom_du_site)) e.push("« nom_du_site » est vide."); });
  controler("fiches.json", verifierFiches,
    nb("fiches.json") + " fiche(s), dont " + compterAVerifier(fiches) + " marquée(s) «\u00a0À VÉRIFIER\u00a0».");
  controler("quiz.json", (d, e, a) => verifierQuiz(d, idsFiches, e, a),
    nb("quiz.json") + " question(s), dont " + compterAVerifier(res["quiz.json"].donnees) + " marquée(s) «\u00a0À VÉRIFIER\u00a0».");
  controler("flashcards.json", (d, e, a) => verifierFlashcards(d, idsFiches, e, a),
    nb("flashcards.json") + " carte(s), dont " + compterAVerifier(res["flashcards.json"].donnees) + " marquée(s) «\u00a0À VÉRIFIER\u00a0».");
  controler("methodologie.json", verifierMethodologie,
    nb("methodologie.json") + " méthode(s), dont " + compterAVerifier(res["methodologie.json"].donnees) + " marquée(s) «\u00a0À VÉRIFIER\u00a0».");
  controler("cours-particuliers.json", verifierCours);

  const resume = totalErreurs
    ? '<div class="message message--erreur"><strong>' + totalErreurs + " erreur(s) à corriger.</strong> Les pages concernées risquent de ne pas s'afficher.</div>"
    : '<div class="message message--succes"><strong>Aucune erreur bloquante.</strong> Les points en orange sont de simples rappels.</div>';

  zoneVerif.innerHTML = resume + blocs.join("") +
    '<p class="groupe-boutons"><button class="bouton" type="button" onclick="location.reload()">Relancer la vérification</button></p>';
}

demarrer();
