/* quiz.js — quiz avec QCM et questions « quelle est la solution ? ».
   Adresse possible : quiz.html?arret=identifiant-de-la-fiche (questions d'un seul arrêt). */

const zoneQuiz = document.getElementById("quiz");

let toutesLesQuestions = [];
let titresDesFiches = {};      // identifiant de fiche -> titre
let arretChoisi = parametreURL("arret");

// État de la partie en cours
let serie = [];
let position = 0;
let score = 0;
let erreurs = [];

const LIBELLES_TYPES = { qcm: "QCM", solution: "Quelle est la solution ?" };

/* ---------- Écran d'accueil du quiz ---------- */

function questionsFiltrees(matiere, type) {
  return toutesLesQuestions.filter((q) =>
    (!arretChoisi || q.arret === arretChoisi) &&
    (!matiere || q.matiere === matiere) &&
    (!type || q.type === type)
  );
}

function afficherAccueil() {
  const base = questionsFiltrees();
  const matieres = [...new Set(base.map((q) => q.matiere).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

  const bandeauArret = arretChoisi
    ? '<div class="message message--info">Questions sur l\'arrêt <strong>' +
        echapper(titresDesFiches[arretChoisi] || arretChoisi) + "</strong>. " +
        '<a href="quiz.html">Voir toutes les questions</a></div>'
    : "";

  zoneQuiz.innerHTML =
    bandeauArret +
    '<div class="carte">' +
      "<p>Choisissez vos questions puis lancez le quiz. Chaque réponse est suivie d'une correction expliquée.</p>" +
      '<div class="quiz-options">' +
        '<div><label for="quiz-matiere">Matière</label><select id="quiz-matiere"><option value="">Toutes les matières</option>' +
          matieres.map((m) => '<option value="' + echapper(m) + '">' + echapper(m) + "</option>").join("") +
        "</select></div>" +
        '<div><label for="quiz-type">Type de questions</label><select id="quiz-type">' +
          '<option value="">Tous les types</option><option value="qcm">QCM</option><option value="solution">Quelle est la solution ?</option>' +
        "</select></div>" +
      "</div>" +
      '<label class="case"><input type="checkbox" id="quiz-melanger" checked> Mélanger les questions</label>' +
      '<button class="bouton bouton--large" id="quiz-demarrer" type="button"></button>' +
    "</div>";

  const selMatiere = document.getElementById("quiz-matiere");
  const selType = document.getElementById("quiz-type");
  const boutonDemarrer = document.getElementById("quiz-demarrer");

  function majBouton() {
    const n = questionsFiltrees(selMatiere.value, selType.value).length;
    boutonDemarrer.textContent = n ? "Commencer (" + n + " question" + (n > 1 ? "s" : "") + ")" : "Aucune question pour ce choix";
    boutonDemarrer.disabled = n === 0;
  }
  selMatiere.addEventListener("change", majBouton);
  selType.addEventListener("change", majBouton);
  majBouton();

  boutonDemarrer.addEventListener("click", () => {
    const choisies = questionsFiltrees(selMatiere.value, selType.value);
    serie = document.getElementById("quiz-melanger").checked ? melanger(choisies) : choisies;
    position = 0;
    score = 0;
    erreurs = [];
    afficherQuestion();
  });
}

/* ---------- Une question ---------- */

function enteteQuestion(q) {
  const pourcentage = Math.round((position / serie.length) * 100);
  const arret = q.arret && titresDesFiches[q.arret]
    ? '<span class="quiz-question__arret">' + echapper(titresDesFiches[q.arret]) + "</span>"
    : "";
  return (
    '<div class="quiz-progression" aria-hidden="true"><div style="width:' + pourcentage + '%"></div></div>' +
    '<div class="quiz-question__haut">' +
      "<span>Question " + (position + 1) + " / " + serie.length + " · " + (LIBELLES_TYPES[q.type] || "") + "</span>" +
      (q.a_verifier ? badgeAVerifier() : "") +
    "</div>" +
    arret +
    '<h2 class="quiz-question__texte">' + mettreEnForme(q.question) + "</h2>"
  );
}

function boutonSuivant() {
  const dernier = position === serie.length - 1;
  return '<button class="bouton bouton--large" type="button" id="quiz-suivant">' +
    (dernier ? "Voir mon résultat" : "Question suivante →") + "</button>";
}

function brancherSuivant() {
  const bouton = document.getElementById("quiz-suivant");
  bouton.focus();
  bouton.addEventListener("click", () => {
    position++;
    if (position < serie.length) afficherQuestion();
    else afficherResultat();
  });
}

function afficherQuestion() {
  const q = serie[position];
  if (q.type === "solution") afficherQuestionSolution(q);
  else afficherQuestionQCM(q);
  zoneQuiz.scrollIntoView({ behavior: "smooth", block: "start" });
}

function afficherQuestionQCM(q) {
  const bonne = Number(q.bonne_reponse) - 1;   // dans le fichier, la 1re réponse = 1
  zoneQuiz.innerHTML =
    '<div class="carte quiz-question">' +
      enteteQuestion(q) +
      '<div class="quiz-choix">' +
        (q.choix || []).map((c, i) =>
          '<button type="button" class="quiz-choix__bouton" data-index="' + i + '">' +
            '<span class="quiz-choix__lettre">' + String.fromCharCode(65 + i) + "</span>" +
            "<span>" + mettreEnForme(c) + "</span>" +
          "</button>"
        ).join("") +
      "</div>" +
      '<div id="quiz-correction"></div>' +
    "</div>";

  zoneQuiz.querySelectorAll(".quiz-choix__bouton").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const choisi = Number(bouton.dataset.index);
      const juste = choisi === bonne;
      if (juste) score++;
      else erreurs.push(q);

      zoneQuiz.querySelectorAll(".quiz-choix__bouton").forEach((b, i) => {
        b.disabled = true;
        if (i === bonne) b.classList.add("quiz-choix__bouton--juste");
        else if (i === choisi) b.classList.add("quiz-choix__bouton--faux");
      });

      document.getElementById("quiz-correction").innerHTML =
        '<div class="message ' + (juste ? "message--succes" : "message--erreur") + '">' +
          "<strong>" + (juste ? "Bonne réponse !" : "Mauvaise réponse.") + "</strong>" +
          (juste ? "" : "<p>La bonne réponse était : <strong>" + mettreEnForme((q.choix || [])[bonne]) + "</strong></p>") +
          enParagraphes(q.explication) +
        "</div>" +
        boutonSuivant();
      brancherSuivant();
    });
  });
}

function afficherQuestionSolution(q) {
  zoneQuiz.innerHTML =
    '<div class="carte quiz-question">' +
      enteteQuestion(q) +
      '<label for="quiz-reponse-libre">Votre réponse (facultatif)</label>' +
      '<textarea id="quiz-reponse-libre" placeholder="Rédigez la solution de mémoire, puis comparez avec la correction."></textarea>' +
      '<div id="quiz-correction">' +
        '<button class="bouton bouton--large" type="button" id="quiz-voir">Voir la correction</button>' +
      "</div>" +
    "</div>";

  document.getElementById("quiz-voir").addEventListener("click", () => {
    document.getElementById("quiz-correction").innerHTML =
      '<div class="message message--info"><strong>Correction</strong>' + enParagraphes(q.reponse) + "</div>" +
      (q.explication ? '<div class="quiz-explication">' + enParagraphes(q.explication) + "</div>" : "") +
      "<p><strong>Aviez-vous trouvé l'essentiel ?</strong></p>" +
      '<div class="groupe-boutons groupe-boutons--egal">' +
        '<button class="bouton bouton--erreur" type="button" data-juste="non">Non, à revoir</button>' +
        '<button class="bouton bouton--succes" type="button" data-juste="oui">Oui, j\'avais juste</button>' +
      "</div>";

    document.querySelectorAll("[data-juste]").forEach((b) => {
      b.addEventListener("click", () => {
        if (b.dataset.juste === "oui") score++;
        else erreurs.push(q);
        position++;
        if (position < serie.length) afficherQuestion();
        else afficherResultat();
      });
    });
  });
}

/* ---------- Résultat final ---------- */

function afficherResultat() {
  const total = serie.length;
  const pourcentage = Math.round((score / total) * 100);
  let commentaire = "Continuez vos révisions, vous allez progresser !";
  if (pourcentage === 100) commentaire = "Parfait, rien à redire !";
  else if (pourcentage >= 75) commentaire = "Très bien, encore un petit effort sur quelques points.";
  else if (pourcentage >= 50) commentaire = "C'est un bon début : relisez les fiches des questions manquées.";

  const aRevoir = erreurs.length
    ? "<h2>À revoir</h2><ul class=\"quiz-a-revoir\">" + erreurs.map((q) =>
        "<li>" + mettreEnForme(q.question) +
        (q.arret && titresDesFiches[q.arret]
          ? ' — <a href="fiche.html?id=' + encodeURIComponent(q.arret) + '">relire la fiche ' + echapper(titresDesFiches[q.arret]) + "</a>"
          : "") +
        "</li>"
      ).join("") + "</ul>"
    : "";

  zoneQuiz.innerHTML =
    '<div class="carte quiz-resultat">' +
      '<p class="quiz-resultat__score">' + score + " / " + total + "</p>" +
      '<p class="quiz-resultat__commentaire">' + pourcentage + " % de bonnes réponses. " + commentaire + "</p>" +
      aRevoir +
      '<div class="groupe-boutons">' +
        '<button class="bouton" type="button" id="quiz-recommencer">Refaire un quiz</button>' +
        '<a class="bouton bouton--secondaire" href="fiches.html">Revoir les fiches</a>' +
      "</div>" +
    "</div>";
  document.getElementById("quiz-recommencer").addEventListener("click", afficherAccueil);
}

/* ---------- Démarrage ---------- */

async function demarrer() {
  try {
    toutesLesQuestions = await chargerDonnees("quiz.json");
  } catch (e) {
    afficherErreur(zoneQuiz, e);
    return;
  }
  try {
    const fiches = await chargerDonnees("fiches.json");
    fiches.forEach((f) => { titresDesFiches[f.id] = f.titre; });
  } catch (e) {
    // Les titres des arrêts sont un bonus : le quiz fonctionne sans.
  }
  if (arretChoisi && !toutesLesQuestions.some((q) => q.arret === arretChoisi)) {
    zoneQuiz.innerHTML = '<div class="message message--info">Il n\'y a pas encore de question sur cet arrêt. ' +
      '<a href="quiz.html">Voir toutes les questions</a></div>';
    return;
  }
  afficherAccueil();
}

demarrer();
