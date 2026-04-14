📑 Documentation Master : User Management & Privacy (V4.2)
1. Résumé de la Feature
L'objectif est de passer d'un compte admin unique ("hardcoded") à une gestion dynamique en base de données. Chaque utilisateur aura son propre Token JWT qui filtrera automatiquement ce qu'il peut voir ou supprimer dans le Dashboard et l'Historique.
________________________________________
2. Pipeline Technique (Le Flux de Données)
1.	Inscription (/register) : Un visiteur crée un compte. Le mot de passe est haché via bcrypt. Un user_id unique est généré.
2.	Identification (/login) : Le système vérifie les identifiants en base SQL. Si c'est bon, il génère un JWT contenant le user_id et le role (user/admin).
3.	Persistance & Isolation :
○	Chaque action (ParseAI) enregistre l'ID de l'utilisateur dans la colonne owner_id.
○	Le Dashboard n'affiche que les alertes où owner_id == current_user_id.
4.	Contrôle (Delete) : L'utilisateur peut supprimer ses propres données. Le backend valide la propriété avant d'effacer le record SQL.
________________________________________
3. Ce qu'il te faut installer (Bibliothèques)
Backend (FastAPI)
Bash
pip install passlib[bcrypt] python-jose[cryptography]

●	passlib : Pour le hachage sécurisé des mots de passe.
●	python-jose : Pour la gestion des jetons JWT (signature et expiration).
________________________________________
4. Étapes de Réalisation (Pas à Pas)
Étape 1 : Migration de la Base de Données (SQLite)
Ajoute les tables nécessaires sans supprimer tes données actuelles.
●	Table users : id (PK), username (Unique), password_hash, role.
●	Table cti_events : Ajouter la colonne owner_id (TEXT).
Étape 2 : Transformer ton Admin "Static" en "Dynamic"
Crée un script de migration qui insère ton compte admin actuel dans la nouvelle table users avec son mot de passe haché. Ton code de login pointera désormais sur cette table.
Étape 3 : La logique de Suppression (Delete)
1.	Backend : Crée une route DELETE /api/parse-ai/{id}.
○	Sécurité : Elle doit récupérer le user_id depuis le token et vérifier : if event.owner_id == user_id: proceed_to_delete.
2.	Frontend : Ajoute un bouton "Supprimer" sur les cartes de l'historique. Utilise un confirm() avant de lancer le fetch.
Étape 4 : Protection des Routes Next.js
Mets à jour ton AuthContext pour qu'il stocke non seulement le token, mais aussi les infos de profil (username). Assure-toi que la page /parse-ai-history redirige vers /login si aucun token n'est présent.
________________________________________
5. Erreurs à Éviter (Checklist de Sécurité)
Danger	Solution
Fuite de données (Data Leak)	Ne jamais oublier le WHERE owner_id = ... dans tes requêtes SQL. Un utilisateur ne doit jamais pouvoir deviner l'ID d'un autre pour voir ses news.
Mots de passe vulnérables	INTERDICTION de stocker des mots de passe en clair. Même l'admin ne doit pas pouvoir lire le mot de passe d'un utilisateur.
JWT sans expiration	Garde ta limite de 30 min. Si le token expire, le frontend doit supprimer le localStorage et renvoyer au login.
Suppression accidentelle	Ajoute une animation "Fade-out" en CSS pour confirmer visuellement la suppression à l'utilisateur.
________________________________________
6. Durée Estimée
●	Migration SQL & Hachage : 1h30.
●	Routes Auth (Register/Login) : 2h30.
●	Système de suppression & Filtrage : 2h00.
●	UI Profil & Intégration Sidebar : 1h30.
●	TOTAL : ~7 à 8 heures (1 journée de travail intense).
________________________________________
💡 Conseil pour un code robuste
Pour ta démo, crée deux comptes : admin et user1.
1.	Connecte-toi avec user1, fais un ParseAI.
2.	Déconnecte-toi, connecte-toi avec admin.
3.	Montre que l'historique de l'admin est différent ou qu'il a le pouvoir de voir tout le monde (si tu lui donnes le rôle super-user). C'est ce qui prouve que ton Isolation fonctionne parfaitement.
