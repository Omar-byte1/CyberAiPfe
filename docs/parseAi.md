📂 Documentation Complète : Feature ParseAI (V3.2)
1. Résumé du Projet ParseAI
ParseAI est un module d'ingestion autonome. Il permet à un analyste de coller une URL de news (ex: BleepingComputer) pour générer automatiquement un "Clean Event" structuré, avec extraction d'IOCs, scoring de menace et géolocalisation, sans aucune fuite de données (100% local via Ollama).
2. Pipeline Technique (Flux de Données)
[Image d'un pipeline de données CTI allant du scraping à l'IA locale]
Ingestion : L'utilisateur soumet une URL dans le frontend Next.js.
Collecte (Scraping) : FastAPI appelle un script Python qui utilise BeautifulSoup pour extraire le texte utile.
Extraction Regex : Identification immédiate des IPs, CVEs et Domaines (100% fiable).
Enrichissement IA (Ollama) : Le modèle qwen2.5-coder:3b analyse le contexte pour définir le threat_level, le role des IOCs et rédiger la description.
Normalisation (Cleaning) : Le backend valide le format JSON et calcule le score de confiance.
Stockage & Diffusion : L'événement est sauvegardé dans news.db (SQLite) et injecté dans l' AlertContext du Dashboard.
3. Installation & Bibliothèques
A. Environnement Python (Backend)
Dans ton dossier api/ ou à la racine de ton projet Python :
# Installation des bibliothèques nécessaires
pip install fastapi uvicorn requests beautifulsoup4 lxml langchain_community


requests : Pour télécharger les pages web.
beautifulsoup4 + lxml : Pour nettoyer le HTML proprement.
langchain_community : Pour communiquer facilement avec Ollama.
B. Environnement IA (Ollama)
Installer Ollama (ollama.com).
Lancer : ollama pull qwen2.5-coder:3b.
Vérifier que le serveur tourne sur le port 11434.
C. Environnement Frontend (Next.js)
Aucune nouvelle bibliothèque n'est nécessaire si tu as déjà lucide-react.
4. Étapes de réalisation (Pas à Pas)
Étape 1 : Le "Cœur" Backend (parse_engine.py)
Action : Créer la route POST qui accepte une URL.
Vérification : Tester avec une URL réelle. Le script doit renvoyer du texte propre (sans balises HTML).
Étape 2 : L'Intelligence Artificielle
Action : Configurer le prompt pour qwen2.5-coder.
Vérification : Envoyer le texte nettoyé à l'IA et vérifier qu'elle répond un JSON valide contenant threat_level (1-4).
Étape 3 : La Page Isolée (/app/parse-ai/page.tsx)
Action : Créer la page avec un champ de saisie et un bouton "Analyser".
Vérification : Vérifier que la page utilise le layout global et que le lien dans la Sidebar est actif.
Étape 4 : Stockage & Nettoyage (SQLite)
Action : Créer la table cti_events et la fonction auto_purge().
Vérification : Vérifier que si tu ajoutes 10 news, les plus anciennes sont bien gérées.
5. Erreurs Critiques à Éviter
Pollution de l'IA : Ne jamais envoyer de balises <script> ou <style>. Cela rend l'IA confuse et lente.
Absence de Try/Except : Si un site bloque le scraping (ex: Cloudflare), ton API ne doit pas crasher. Elle doit renvoyer une erreur propre : "Erreur: Accès refusé par le site distant".
Blocage UI : L'analyse peut prendre 8 secondes. Si tu n'affiches pas un Spinner/Loading, l'utilisateur croira que le site est planté.
JSON Malformé : L'IA peut parfois "parler" avant le JSON. Toujours utiliser une expression régulière pour extraire uniquement le bloc { ... }.