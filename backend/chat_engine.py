import json
import os
import re
import cloudscraper
from bs4 import BeautifulSoup
from langchain_ollama import OllamaLLM

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INCIDENTS_FILE = os.path.join(BASE_DIR, "data", "incidents.json")

class ChatEngine:
    def __init__(self):
        # Initializing the local Qwen coder model identical to ParseAI
        self.llm = OllamaLLM(model="qwen2.5-coder:3b", temperature=0.3)
        self.scraper = cloudscraper.create_scraper(browser={'browser': 'chrome', 'platform': 'windows', 'desktop': True})

    def fetch_live_news(self) -> str:
        """
        Scrapes the 5 latest news headlines and short descriptions from The Hacker News frontpage.
        """
        try:
            response = self.scraper.get("https://thehackernews.com/", timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'lxml')
            
            # The Hacker News uses <div class="body-post clear"> for news blocks
            articles = soup.find_all('div', class_='body-post clear', limit=5)
            news_context = []
            
            for article in articles:
                title_tag = article.find('h2', class_='home-title')
                desc_tag = article.find('div', class_='home-desc')
                date_tag = article.find('div', class_='item-label')
                
                title = title_tag.get_text(strip=True) if title_tag else "No title"
                desc = desc_tag.get_text(strip=True) if desc_tag else "No description"
                date_text = date_tag.get_text(separator=' ', strip=True) if date_tag else "Recent"
                
                # Cleanup date text (often includes author)
                date_text = re.sub(r'[\r\n\t]', ' ', date_text)
                
                news_context.append(f"- [{date_text}] {title}: {desc}")
                
            if not news_context:
                return "Je n'ai pas pu récupérer de news en direct sur le site."
                
            return "\n".join(news_context)
            
        except Exception as e:
            return f"Erreur lors de la récupération des news: {str(e)}"

    def fetch_local_incidents(self) -> str:
        """
        Reads the top 5 most recent incidents from the local database.
        """
        if not os.path.exists(INCIDENTS_FILE):
             return "La base de données d'incidents est vide ou n'existe pas."
             
        try:
            with open(INCIDENTS_FILE, "r", encoding="utf-8") as f:
                incidents = json.load(f)
                
            if not incidents:
                 return "Il n'y a aucun incident enregistré actuellement."
                 
            # Get latest 5 incidents
            recent_incidents = incidents[:5]
            incidents_context = []
            
            for inc in recent_incidents:
                # Assuming IncidentRecord schema: id, type, verdict, risk_score, timestamp, details
                inc_id = inc.get('id', 'Unknown')
                inc_type = inc.get('type', 'Unknown')
                verdict = inc.get('verdict', 'Unknown')
                score = inc.get('risk_score', 'N/A')
                
                desc = inc.get('details', {}).get('description', '')
                if not desc:
                    desc = inc.get('details', {}).get('ip', 'Unknown entity')
                    
                incidents_context.append(f"- Incident {inc_id} ({inc_type}) | Alert: {verdict} | Score: {score}/100 | Desc: {desc}")
                
            return "\n".join(incidents_context)
            
        except Exception as e:
             return f"Erreur de lecture de la DB: {str(e)}"

    def chat(self, user_message: str) -> str:
        """
        Routes the user's intent, fetches relevant real-time context if needed, and queries the LLM.
        """
        msg_lower = user_message.lower()
        context = ""
        mode = "Général"
        
        # 1. Intent Routing
        if any(word in msg_lower for word in ["news", "actualité", "actualités", "nouvelles", "récent", "hacker news"]):
            mode = "Actualités en Temps Réel"
            live_news = self.fetch_live_news()
            context = f"Dernières actualités de Cybersécurité récupérées en temps réel :\n{live_news}"
            
        elif any(word in msg_lower for word in ["incident", "incidents", "alerte", "alertes", "local", "serveur", "base de donnée"]):
            mode = "Base de données SoC Locale"
            local_inc = self.fetch_local_incidents()
            context = f"Récapitulatif des derniers incidents du réseau local :\n{local_inc}"
        
        else:
            context = "L'utilisateur pose une question générale de cybersécurité. Pas de données en temps réel requises."

        # 2. Prompt Construction
        prompt = f"""
Tu es l'Assistant Cybersécurité IA du tableau de bord "Cyber Threat Intelligence". 
Tu dois répondre à l'ingénieur SOC de manière professionnelle, concise et claire (utilise le Markdown pour formater ta réponse). 
Réponds TOUJOURS en Français.

CONGTEXTE FOURNI PAR LE SYSTEME ({mode}) :
{context}

QUESTION DE L'UTILISATEUR :
{user_message}

INSTRUCTIONS DE REPONSE :
- Si la question concerne les news, résume élégamment le contexte fourni.
- Si la question concerne les incidents, liste-les clairement avec leurs scores de risque.
- Réponds directement et sans blabla ("Bonjour", etc. sont inutiles, va droit au but).
"""

        try:
            # 3. LLM Processing
            response = self.llm.invoke(prompt)
            return response
        except Exception as e:
            return f"❌ AI Engine Error: {str(e)}"

# Standalone test
if __name__ == "__main__":
    engine = ChatEngine()
    print("Testing News RAG:")
    print(engine.chat("Quelles sont les dernières news cyber aujourd'hui ?"))
    print("\n----------------\n")
    print("Testing DB RAG:")
    print(engine.chat("Fais moi un check des derniers incidents sur mon réseau."))
