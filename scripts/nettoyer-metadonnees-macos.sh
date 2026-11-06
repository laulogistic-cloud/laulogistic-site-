#!/bin/sh
# Supprime les fichiers AppleDouble (._*) créés par macOS — dans le dépôt de
# travail ET dans .git.
#
# Pourquoi : ce dépôt vit sur un volume externe qui stocke les métadonnées
# macOS sous forme de fichiers ._*. git les lit comme des index de pack
# (« non-monotonic index ») et comme des références (« badRefName »), ce qui
# fait échouer fetch et push. Ils réapparaissent à chaque écriture : le
# nettoyage doit donc être répété, pas fait une seule fois.
#
# Usage manuel  : sh scripts/nettoyer-metadonnees-macos.sh
# Automatique   : hooks .githooks/pre-commit et .githooks/pre-push
#                 (activer une fois avec : git config core.hooksPath .githooks)
#
# Ne supprime que les fichiers dont le nom commence par « ._ ».
# Ne bloque jamais une opération git : sort toujours avec le code 0.

set -u

racine=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$racine" 2>/dev/null || exit 0

compter() {
  find "$@" 2>/dev/null | wc -l | tr -d ' '
}

arbre=$(compter . -name '._*' -not -path './.git/*')
interne=$(compter .git -name '._*')

if [ "$arbre" -gt 0 ]; then
  find . -name '._*' -not -path './.git/*' -delete 2>/dev/null
fi

if [ "$interne" -gt 0 ]; then
  find .git -name '._*' -delete 2>/dev/null
fi

if [ "$arbre" -gt 0 ] || [ "$interne" -gt 0 ]; then
  printf 'Métadonnées macOS : %s fichier(s) retiré(s) de l’arborescence, %s de .git\n' "$arbre" "$interne"
fi

exit 0
