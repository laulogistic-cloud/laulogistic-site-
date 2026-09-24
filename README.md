# 🌐 Laulogistic - Site Vitrine & Interface de Conversion

Ce dossier contient la version déployable du site vitrine de **Laulogistic**, conçu comme un outil de conversion pour le consulting opérationnel en Facility & Property Management.

## 🎯 Objectif Stratégique
Le site n'est pas une simple présentation de services, mais un entonnoir de vente basé sur la **résolution de problèmes réels** :
- **Cible :** Directions Immobilières, Asset Managers, Gestionnaires de sites complexes.
- **Angle :** Le "Pilote d'environnements opérationnels" qui intervient là où l'historique a disparu et où les ressources manquent.
- **Conversion :** Passage d'un visiteur $\rightarrow$ Diagnostic Flash $\rightarrow$ Qualification du périmètre $\rightarrow$ Mission.

---

## 🛠️ Structure Technique

### Fichiers
- `index.html` : page principale, Single Page Application (HTML + CSS + JS) : navigation, sections FM / Property / Transmission / Contact et questionnaire de qualification.
- `confidentialite.html` : politique de confidentialité (RGPD, cookies, sous-traitant Formspree).
- `ressources/fiches-outils.html` : bibliothèque des 11 fiches outils + formulaire de demande du PDF.
- `ressources/*.html` : les 11 fiches outils, une page autonome chacune (navigation « fiche précédente / suivante » incluse). Chaque fiche est calibrée pour tenir sur **une seule page A4** à l'impression, avec un jeu de styles d'impression dédié (contrastes vérifiés au seuil WCAG AA).
- `og-image.html` + `og-image.png` : source et image de partage 1200×630 (LinkedIn, WhatsApp, X).
- `robots.txt`, `sitemap.xml` : indexation.

> **Important :** le déploiement doit inclure **tout le dossier**, y compris `ressources/`. Un envoi du seul `index.html` produit un lien « Fiches outils » qui renvoie une page vide (404 GitHub Pages).

> **Un seul `index.html` :** la bibliothèque des fiches outils s'appelle désormais `ressources/fiches-outils.html` (elle s'appelait `ressources/index.html`). Il n'existe donc plus qu'un unique fichier nommé `index.html` — celui de la racine — ce qui évite toute confusion à l'envoi vers GitHub.

### Stack Technique
- **Design :** Mobile-first, Responsive.
- **Typographies :** *Cormorant Garamond* (Prestige/Autorité) & *DM Sans* (Modernité/Technique).
- **Performance :** Zéro dépendance externe lourde (chargement instantané).

---

## 🚀 Guide de Déploiement

### 1. Mise en ligne
Le site est autonome. Pour le mettre en ligne :
1. Téléverser le contenu du dossier `deploy/` vers votre hébergeur (via FTP ou Git).
2. S'assurer que le fichier `index.html` est à la racine du domaine (`www.laulogistic.com`).

### 2. Formulaires (Formspree)
Les deux formulaires du site (questionnaire de contact sur `index.html`, demande des fiches PDF sur `ressources/fiches-outils.html`) envoient leurs données à **Formspree**, qui les transmet directement par e-mail.
- **Endpoint configuré :** `https://formspree.io/f/xpqklqnw` (formulaire à gérer sur [formspree.io](https://formspree.io)).
- **Réception :** les messages arrivent sur l'adresse e-mail associée à ce formulaire Formspree, avec l'objet « Diagnostic flash — <nom> » (ou « Demande fiches outils PDF »).
- **Répondre au prospect :** le champ `email` est transmis à Formspree, un simple « Répondre » dans votre boîte répond donc directement au visiteur.
- **Secondaire (Fallback) :** si l'envoi API échoue (réseau, quota, endpoint invalide), un `mailto:` s'ouvre automatiquement avec les données pré-remplies.
- **Spam :** penser à activer la protection anti-spam (reCAPTCHA) dans les réglages du formulaire Formspree si nécessaire.

### 3. Visibilité (SEO)
Le site est prêt à être indexé, mais deux gestes restent à faire côté Google :
- **Google Search Console** : ajouter la propriété `https://www.laulogistic.com` (validation par balise HTML ou par le fichier fourni par Google), puis soumettre `sitemap.xml` dans « Sitemaps ». C'est ce qui déclenche l'exploration des 14 pages.
- **Fiche Google Business Profile** : indispensable pour les recherches locales (Fontenay-sous-Bois / Île-de-France).

Déjà en place dans le dépôt :
- `robots.txt` : indexation autorisée sur tout le site + déclaration du sitemap.
- `sitemap.xml` : les 14 URL (accueil, bibliothèque, 11 fiches, confidentialité).
- **Données structurées JSON-LD** sur les 14 pages : `ProfessionalService` + `Person` + `WebSite` sur l'accueil, `CollectionPage` + `ItemList` sur la bibliothèque, `Article` + `BreadcrumbList` sur chaque fiche.
- **Métadonnées de partage** (`og:*`, `twitter:*`) sur les 14 pages, avec l'image réelle `og-image.png`.
- **Maillage interne** : les 11 fiches sont liées depuis l'accueil avec un texte d'ancre descriptif, et se chaînent entre elles.

Pour régénérer l'image de partage après une modification de `og-image.html` :
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --hide-scrollbars --force-device-scale-factor=1 --virtual-time-budget=6000 \
  --window-size=1200,630 --screenshot="$(pwd)/og-image.png" "file://$(pwd)/og-image.html"
```

### 4. Assets optionnels
- `favicon.ico` : non requis, une icône SVG est déjà intégrée en `data:` URI dans chaque page.

---

## 📈 Logique du Questionnaire de Qualification

Le formulaire de contact est un **outil de pré-diagnostic**. Il collecte 4 niveaux de données :
1. **Identité :** Qui est le décideur ?
2. **Périmètre :** Quelle est la taille du risque (m², nombre de biens) ?
3. **Douleur (Pain Point) :** Quel est le blocage prioritaire (Historique, Personnel, Conformité) ?
4. **Validation :** Accord RGPD et engagement.

**Utilisation :** Les données reçues permettent de préparer l'appel de diagnostic avec un argumentaire déjà ciblé sur la douleur du client.

---

## 📝 Maintenance & Évolutions
Pour modifier les textes ou les offres :
- Ouvrir `index.html`.
- Rechercher les sections `<!-- PAGE ... -->`.
- Modifier le contenu textuel sans toucher aux classes CSS pour préserver l'identité visuelle.
