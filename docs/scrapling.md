🛡️ Documentation : Intelligence Engine & Data Sovereignty (V5.0)1. Résumé de la FeatureCette étape consiste à automatiser l'extraction de menaces depuis le web (via Scrapling), à les faire analyser par l'IA (Ollama) selon les standards TLP 2.0 et MISP, et à permettre une gestion sécurisée de cet historique (Suppression/Isolation).2. Le Pipeline Complet (Flux de Données)Requête Utilisateur : L'utilisateur connecté envoie une URL via le frontend Next.js.Scraping Furtif (Scrapling) : Le backend lance un StealthyFetcher. Il contourne les protections (Cloudflare/WAF) et récupère le contenu texte propre.Analyse IA (Ollama/Qwen) : L'IA reçoit le texte et doit extraire :IOCs : IPs, Domaines, Hashes.Mapping MISP : Assigne un Type et une Catégorie à chaque IOC.Label TLP : Détermine le niveau de confidentialité (RED, AMBER, GREEN, CLEAR).Stockage SQL : L'événement est enregistré dans la table cti_events avec l'owner_id de l'utilisateur.Affichage & Contrôle : L'utilisateur voit ses résultats en couleur et peut supprimer ses analyses.3. Bibliothèques à installerIl est crucial d'installer les dépendances de navigation pour que le mode furtif fonctionne.Bash# Installation du framework
pip install "scrapling[all]"

# Installation des navigateurs et dépendances système (Indispensable)
scrapling install
4. Normalisation des StandardsA. Traffic Light Protocol (TLP 2.0)Dans ton JSON et ton interface, remplace les chiffres par ces labels officiels :LabelUsageCouleur HexTLP:REDStrictement personnel / Équipe restreinte#FF0000TLP:AMBERLimité à l'organisation et ses clients#FFBF00TLP:GREENPartage autorisé au sein de la communauté#32CD32TLP:CLEARInformation publique (News, Blogs)#FFFFFFB. Attributs MISP (Exemples pour l'IA)Ton IA doit classer chaque IOC selon ce format :IP suspecte : Type: ip-dst | Category: Network activityFichier malveillant : Type: sha256 | Category: Payload deliveryVulnérabilité : Type: vulnerability (CVE) | Category: External analysis5. Étapes d'implémentation (Pas à Pas)Étape 1 : Le Service de ScrapingRemplace ton ancien code par une fonction utilisant StealthyFetcher.Pythonfrom scrapling.fetchers import StealthyFetcher

async def fetch_threat_data(url):
    # Le mode adaptive=True permet de retrouver les données même si le site change de design
    page = StealthyFetcher.fetch(url, headless=True, solve_cloudflare=True)
    return page.css('body::text').get()
Étape 2 : Sécuriser la Suppression (Backend)Ne supprime jamais uniquement par ID. Vérifie toujours le propriétaire.Python@app.delete("/api/cti-events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_current_user)):
    # On s'assure que l'utilisateur ne supprime que SES données
    target = db.query(CTIEvent).filter(
        CTIEvent.id == event_id, 
        CTIEvent.owner_id == current_user.id
    ).first()
    
    if not target:
        raise HTTPException(status_code=403, detail="Non autorisé")
        
    db.delete(target)
    db.commit()
    return {"message": "Analyse supprimée"}
6. Erreurs à éviter (Checklist)Oubli du scrapling install : Sans cela, ton backend plantera en essayant de lancer le navigateur.ID en clair dans l'URL : Pour la suppression, assure-toi que ton frontend envoie bien le Token JWT, sinon n'importe qui peut appeler l'API de suppression.Hallucination de l'IA : Parfois l'IA invente des couleurs TLP (ex: "Blue"). Force-la dans ton prompt à n'utiliser que les 4 couleurs officielles.Fuite de mémoire : Si tu lances trop de scrapings en même temps, ton PC va ramer. Utilise headless=True pour économiser de la RAM.7. Résultat attendu sur le DashboardDans ta page History, chaque carte doit maintenant avoir :Un Badge de couleur (Rouge, Orange, Vert) selon le TLP.Une Liste d'IOCs bien rangée par catégories MISP.Un Bouton Corbeille qui déclenche la suppression sécurisée.