/* accueil.js — affiche le nombre de fiches, questions et flashcards sur la page d'accueil. */

async function afficherCompteur(fichier, idElement, singulier, pluriel) {
  const element = document.getElementById(idElement);
  if (!element) return;
  try {
    const donnees = await chargerDonnees(fichier);
    const n = donnees.length;
    element.textContent = n + " " + (n > 1 ? pluriel : singulier);
  } catch (e) {
    // Le compteur est un simple bonus : en cas d'erreur, on n'affiche rien.
  }
}

afficherCompteur("fiches.json", "compteur-fiches", "fiche", "fiches");
afficherCompteur("quiz.json", "compteur-quiz", "question", "questions");
afficherCompteur("flashcards.json", "compteur-flashcards", "carte", "cartes");
