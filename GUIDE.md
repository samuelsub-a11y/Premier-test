# Guide d'utilisation du site

Ce guide explique comment faire vivre le site **sans écrire de code** : ajouter des fiches, des questions et des flashcards, modifier vos textes et mettre le site en ligne.

---

## 1. Comment le site est organisé

```
donnees/                  ← LE SEUL DOSSIER QUE VOUS AVEZ À MODIFIER
├── fiches.json           → les fiches d'arrêts
├── quiz.json             → les questions de quiz
├── flashcards.json       → les flashcards
├── methodologie.json     → les pages de méthodologie
├── cours-particuliers.json → votre page « Cours particuliers »
└── site.json             → le nom et le slogan du site

*.html, css/, js/         → le code et l'apparence (inutile d'y toucher)
verification.html         → l'outil qui contrôle vos fichiers
```

Chaque page lit le fichier qui la concerne. Si vous ajoutez un arrêt dans `fiches.json`, il apparaît automatiquement dans la liste, la recherche et les filtres.

---

## 2. Les règles d'écriture d'un fichier JSON

Un fichier JSON est un texte très structuré. Une seule virgule oubliée empêche la page de s'afficher. Voici les règles à respecter :

| Règle | Exemple correct |
|---|---|
| Les noms de champ et les textes sont entre **guillemets droits** `"` | `"titre": "Costa c/ ENEL"` |
| Dans vos textes, utilisez les guillemets français **« »** et jamais `"` | `"solution": "La Cour juge que « … »."` |
| Les éléments sont séparés par une **virgule**… | `"titre": "…",` puis `"date": "…"` |
| … mais **pas de virgule après le dernier** élément d'un bloc ou d'une liste | `["Primauté", "Effet direct"]` |
| `true` / `false` et les nombres s'écrivent **sans guillemets** | `"a_verifier": true,` `"annee": 1964,` |
| Une liste s'écrit entre crochets `[ ]`, un bloc entre accolades `{ }` | |

**Mise en forme dans les textes :** entourez des mots de deux étoiles pour les mettre en gras : `**primauté**`.

**Plusieurs paragraphes :** au lieu d'un seul texte, mettez une liste de textes. Chaque élément devient un paragraphe :

```json
"faits": [
  "Premier paragraphe.",
  "Deuxième paragraphe."
]
```

Les espaces avant `?`, `!`, `:`, `;` et à l'intérieur des guillemets « » sont gérés automatiquement : écrivez normalement.

> 💡 **Le plus simple :** copiez un bloc existant, collez-le juste après, puis modifiez le texte entre les guillemets.

---

## 3. Ajouter une nouvelle fiche d'arrêt

1. Ouvrez `donnees/fiches.json`.
2. Allez à la fin du fichier. Le dernier bloc se termine par `}` puis la ligne `]`.
3. Ajoutez une **virgule** après ce dernier `}`, puis collez le modèle ci-dessous avant le `]` final.
4. Remplissez les champs, enregistrez et ouvrez `verification.html` pour contrôler.

```json
  {
    "id": "nom-de-l-arret",
    "titre": "Nom court de l'arrêt",
    "intitule_complet": "Partie A c/ Partie B",
    "juridiction": "CJUE",
    "date": "1er janvier 2000",
    "annee": 2000,
    "reference": "Aff. C-000/00",
    "matiere": "Droit de l'Union européenne",
    "themes": ["Thème 1", "Thème 2"],
    "a_verifier": true,
    "resume": "Une phrase qui résume l'apport de l'arrêt (affichée dans la liste).",
    "faits": ["…"],
    "procedure": ["…"],
    "probleme": "La question de droit, sous forme interrogative ?",
    "solution": ["…"],
    "portee": ["…"],
    "textes": ["Art. 267 TFUE"]
  }
```

**À savoir :**
- **`id`** : identifiant unique, en minuscules, sans accent ni espace (des tirets à la place). Il apparaît dans l'adresse de la fiche (`fiche.html?id=nom-de-l-arret`). Ne le changez plus une fois la fiche publiée.
- **`matiere`** : pour créer une nouvelle matière (ex. `"Droit administratif"`), il suffit de l'écrire. Elle apparaît automatiquement dans les filtres. Écrivez-la toujours **exactement** de la même façon, majuscules et accents compris.
- **`themes`** : même principe. Réutilisez les mêmes mots pour que le filtre regroupe les fiches.
- **`annee`** : sert à classer les fiches par ordre chronologique.
- **`intitule_complet`**, **`reference`**, **`resume`** et **`textes`** sont facultatifs : vous pouvez supprimer ces lignes.

---

## 4. Ajouter une question de quiz

Même méthode, dans `donnees/quiz.json`. Il existe deux types de questions.

### Un QCM

```json
  {
    "id": "q-nom-unique",
    "type": "qcm",
    "matiere": "Droit de l'Union européenne",
    "arret": "costa-enel",
    "a_verifier": true,
    "question": "Votre question ?",
    "choix": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    "bonne_reponse": 2,
    "explication": "Pourquoi la réponse B est la bonne."
  }
```

- **`bonne_reponse`** est le **numéro** de la bonne réponse dans la liste `choix` : 1 pour la première, 2 pour la deuxième, etc. Ici, c'est donc « Réponse B ».
- Vous pouvez mettre 2, 3, 4 choix ou plus.

### Une question « quelle est la solution ? »

```json
  {
    "id": "q-nom-unique-2",
    "type": "solution",
    "matiere": "Droit de l'Union européenne",
    "arret": "costa-enel",
    "a_verifier": true,
    "question": "Quelle est la solution de l'arrêt … ?",
    "reponse": "La solution attendue.",
    "explication": "Les points clés que l'étudiant devait mentionner."
  }
```

- **`arret`** (facultatif) : l'`id` de la fiche concernée. La question apparaît alors quand on clique sur « S'entraîner sur cet arrêt » dans la fiche, et le résultat du quiz renvoie vers la fiche.

---

## 5. Ajouter une flashcard

Dans `donnees/flashcards.json` :

```json
  {
    "id": "fc-nom-unique",
    "matiere": "Droit de l'Union européenne",
    "theme": "Primauté",
    "arret": "costa-enel",
    "a_verifier": true,
    "recto": "La question (face visible).",
    "verso": "La réponse (face cachée)."
  }
```

⚠️ **Ne modifiez jamais l'`id` d'une carte existante.** La progression des visiteurs est enregistrée grâce à cet identifiant : le changer revient à créer une nouvelle carte.

---

## 6. Après votre relecture : retirer « À VÉRIFIER »

Dans chaque fiche, question, flashcard ou méthode, remplacez :

```json
"a_verifier": true,
```

par :

```json
"a_verifier": false,
```

Le badge orange et le bandeau d'avertissement disparaissent aussitôt. La page `verification.html` indique combien d'éléments restent à vérifier.

---

## 7. Modifier vos autres textes

- **Page « Cours particuliers »** : `donnees/cours-particuliers.json`. Remplacez chaque `[À COMPLÉTER]`, qui est surligné en jaune sur la page, et surtout l'adresse e-mail (`"email"`).
  Si vous préférez ne pas afficher votre adresse, créez un formulaire gratuit (Google Forms, Tally…) et collez son lien dans `"lien_formulaire"`. Un second bouton apparaît alors.
- **Nom et slogan du site** : `donnees/site.json`.
- **Méthodologie** : `donnees/methodologie.json`. Chaque section peut contenir un `"texte"` (paragraphes), une `"liste"` (puces), un `"conseil"` (encadré bleu) et un `"exemple"`.

---

## 8. Vérifier vos modifications

Après chaque modification, ouvrez la page **`verification.html`**, sur votre ordinateur ou en ligne (par exemple `https://votre-site/verification.html`). Elle vous signale en français :
- les erreurs d'écriture, avec le numéro de ligne approximatif ;
- les identifiants en double ;
- les QCM dont la bonne réponse n'existe pas ;
- les références à une fiche inexistante ;
- ce qui reste « À VÉRIFIER » ou « À COMPLÉTER ».

Cette page n'apparaît pas dans le menu du site.

---

## 9. Tester le site sur votre ordinateur

Les navigateurs refusent de lire les fichiers JSON quand on ouvre une page par double-clic. Deux solutions :

**Solution A : ne pas tester en local.** Modifiez directement sur GitHub (voir la partie 11) et regardez le résultat en ligne une minute plus tard. C'est le plus simple au début.

**Solution B : lancer un petit serveur local.**
- **Avec Visual Studio Code** (éditeur gratuit et conseillé) : installez l'extension **« Live Server »**, ouvrez le dossier du site, faites un clic droit sur `index.html` puis choisissez « Open with Live Server ».
- **Avec Python** (déjà installé sur Mac) : ouvrez le Terminal dans le dossier du site et tapez :
  ```
  python3 -m http.server
  ```
  puis ouvrez `http://localhost:8000` dans votre navigateur. Faites `Ctrl + C` dans le Terminal pour arrêter.

---

## 10. Mettre le site en ligne gratuitement (GitHub Pages)

Votre code est déjà sur GitHub : GitHub Pages peut l'héberger gratuitement.

**Étape 1 : regrouper le travail sur la branche principale.**
Le site a été développé sur la branche `claude/law-revision-site-p2fjrq`. Sur la page GitHub du dépôt, un bandeau jaune propose **« Compare & pull request »**. Cliquez dessus, puis sur **« Create pull request »**, puis sur **« Merge pull request »** et enfin **« Confirm merge »**. Le site est maintenant sur la branche `main`.

**Étape 2 : activer GitHub Pages.**
1. Dans le dépôt, cliquez sur **Settings** (Paramètres), puis sur **Pages** dans le menu de gauche.
2. Sous « Build and deployment », réglez **Source** sur **« Deploy from a branch »**.
3. Sous **Branch**, choisissez **`main`** et le dossier **`/ (root)`**, puis cliquez sur **Save**.
4. Patientez une à deux minutes et rechargez la page : l'adresse de votre site s'affiche en haut, du type `https://samuelsub-a11y.github.io/Premier-test/`.

⚠️ Avec un compte GitHub gratuit, GitHub Pages ne fonctionne que si le dépôt est **public** (Settings → General → tout en bas, « Change repository visibility »). Tout le contenu du dépôt devient alors visible par tous : c'est normal pour un site web, mais n'y mettez rien de privé.

**Ensuite :** chaque modification enregistrée sur la branche `main` est mise en ligne automatiquement en une à deux minutes.

**Alternatives gratuites :** [Netlify](https://www.netlify.com/) (« Add new site » puis « Deploy manually » : on glisse simplement le dossier du site dans la page) ou [Cloudflare Pages](https://pages.cloudflare.com/). Les deux acceptent aussi un dépôt privé.

**Nom de domaine personnalisé** (facultatif, environ 10 € par an) : achetez un nom (ex. `revisions-droit.fr`) chez un registraire, puis indiquez-le dans Settings → Pages → « Custom domain ».

---

## 11. Modifier le site directement depuis GitHub (sans rien installer)

1. Sur la page du dépôt, ouvrez le dossier `donnees/` puis le fichier à modifier (ex. `fiches.json`).
2. Cliquez sur l'icône **crayon** ✏️ (« Edit this file »).
3. Faites vos modifications.
4. Cliquez sur **« Commit changes… »**, écrivez une courte description (ex. « Ajout de l'arrêt Francovich ») et validez.
5. Au bout d'une à deux minutes, ouvrez `verification.html` sur votre site en ligne pour contrôler.

En cas d'erreur, rien n'est perdu : GitHub garde l'historique de toutes les versions (bouton **History** sur chaque fichier).
