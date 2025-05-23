# Gestionnaire de Projet Avancé

Une application web interactive pour la gestion de projets avec visualisation Gantt et PERT, développée avec Next.js et D3.js.

## 🚀 Fonctionnalités

### Planification de Projet
- **Création de tâches dynamique** : Ajout/suppression de tâches avec génération automatique d'identifiants (A, B, C...)
- **Définition des dépendances** : Spécification des tâches prérequises pour chaque activité
- **Calcul automatique CPM** : Méthode du chemin critique avec calcul des dates au plus tôt/tard
- **Identification du chemin critique** : Détection automatique des tâches critiques sans marge

### Visualisations Interactives
- **Diagramme de Gantt** : Représentation temporelle avec barres colorées (rouge pour critique, bleu pour normal)
- **Diagramme PERT** : Réseau d'activités avec nœuds détaillés montrant ES/EF/LS/LF
- **Navigation par onglets** : Basculement fluide entre les deux types de diagrammes

### Interface Utilisateur
- **Design moderne** : Interface claire avec Tailwind CSS
- **Responsive** : Adaptation automatique à tous les écrans
- **Feedback visuel** : Code couleur pour différencier les éléments critiques
- **Validation** : Contrôles de saisie avec messages d'erreur

## 🛠️ Technologies Utilisées

- **Next.js 13+** : Framework React avec App Router
- **TypeScript** : Typage statique pour une meilleure robustesse
- **D3.js** : Bibliothèque de visualisation de données
- **Tailwind CSS** : Framework CSS utilitaire
- **React Hooks** : useState, useRef, useEffect pour la gestion d'état

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/Napster7-0/tp2.git
cd tp2
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Lancer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
```

4. **Accéder à l'application**
Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## 🎯 Guide d'Utilisation

### 1. Création des Tâches
- Cliquez sur "Ajouter une Tâche" pour créer une nouvelle activité
- Remplissez les champs :
  - **Nom** : Description de la tâche
  - **Durée** : Nombre de jours nécessaires
  - **Prédécesseurs** : Tâches qui doivent être terminées avant (ex: A, B, C)

### 2. Calcul du Projet
- Une fois toutes les tâches définies, cliquez sur "Calculer le Projet"
- L'algorithme CPM calcule automatiquement :
  - Les dates au plus tôt (ES/EF)
  - Les dates au plus tard (LS/LF)
  - Les marges libres
  - Le chemin critique

### 3. Visualisation
- **Onglet Gantt** : Vue chronologique avec barres horizontales
- **Onglet PERT** : Réseau de dépendances avec nœuds détaillés

### Exemple de Projet
```
Tâche A : Conception (5 jours) - Pas de prédécesseur
Tâche B : Développement (8 jours) - Prédécesseur: A
Tâche C : Tests (3 jours) - Prédécesseur: B
Tâche D : Déploiement (2 jours) - Prédécesseur: C
```

## 🏗️ Architecture du Code

### Structure des Composants
```
src/
├── components/
│   └── home.tsx    # Composant principal
└── page.tsx            # Page d'accueil
```

### Algorithmes Implémentés

#### Méthode CPM (Critical Path Method)
1. **Forward Pass** : Calcul des dates au plus tôt
2. **Backward Pass** : Calcul des dates au plus tard  
3. **Calcul des marges** : Identification du chemin critique

#### Rendu D3.js
- **Gantt** : Échelles temporelles, barres colorées, grille
- **PERT** : Positionnement automatique, connexions fléchées, nœuds divisés

## 🎨 Personnalisation

### Couleurs
- **Critique** : Rouge (#ef4444)
- **Normal** : Bleu (#3b82f6)
- **Interface** : Palette slate/blue

### Responsive Design
- Desktop : Grille 12 colonnes
- Mobile : Empilement vertical automatique

## 🐛 Dépannage

### Problèmes Courants

**Les diagrammes ne s'affichent pas**
- Vérifiez que toutes les tâches ont un nom
- Assurez-vous que les prédécesseurs existent

**Erreur de calcul CPM**
- Évitez les dépendances circulaires
- Vérifiez la syntaxe des prédécesseurs (A, B, C)

**Performance lente**
- Limitez le nombre de tâches (<50)
- Évitez les noms de tâches très longs

## 🚀 Fonctionnalités Futures

- [ ] Export PDF/PNG des diagrammes
- [ ] Import/Export JSON des projets
- [ ] Gestion des ressources
- [ ] Mode collaboratif
- [ ] Optimisation pour mobiles
- [ ] Thèmes personnalisables

## 📋 Scripts Disponibles

```bash
npm run dev      # Démarrage développement
npm run build    # Construction production
npm run start    # Démarrage production
npm run lint     # Vérification code
```

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation D3.js
- Vérifier les logs de la console navigateur

---

**Développé avec ❤️ par Komguem Ouandi**