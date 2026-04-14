import json
import os
import random
import time
from datetime import datetime
from langchain_ollama import OllamaLLM
import re


class AIEngine:

    def __init__(self, model="qwen2.5-coder:3b"):

        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        self.alerts_file = os.path.join(self.base_dir, "data", "alerts.json")
        self.report_file = os.path.join(self.base_dir, "data", "threat_report.json")
        
        # Initialize local AI engine for deep analysis (Virtual Detonation)
        self.re = re
        self.llm = OllamaLLM(
            model=model,
            temperature=0,
            num_ctx=8192
        )

    def analyze_alerts(self):

        if not os.path.exists(self.alerts_file):
            return "Aucune alerte à analyser."

        with open(self.alerts_file, "r", encoding="utf-8") as f:
            alerts = json.load(f)

        if not alerts:
            return "Le fichier d'alertes est vide."

        insights = []

        for alert in alerts:
            cve_id = alert.get("cve_id", "N/A")
            severity = alert.get("severity", 0)
            log_content = alert.get("log", "")

            # Threat score (simple)
            anomaly_score = 1 if cve_id == "ML-ANOMALY" else 0
            try:
                base_severity = float(severity)
            except (ValueError, TypeError):
                base_severity = 0

            threat_score = base_severity + anomaly_score

            # Détermination du niveau SOC
            if threat_score >= 9:
                level = "SOC Level 3 - Critical Threat"
            elif threat_score >= 7:
                level = "SOC Level 2 - High Risk"
            else:
                level = "SOC Level 1 - Warning"

            # Personnalisation de la prédiction et recommandation
            if cve_id == "ML-ANOMALY":
                prediction = "Comportement anormal détecté par l'IA (Machine Learning)"
                recommendation = "Investiguer manuellement le log pour confirmer l'intrusion."
            else:
                prediction = f"Exploitation potentielle de la vulnérabilité {cve_id}"
                recommendation = "Appliquer les correctifs de sécurité immédiatement."

            insight = {
                "cve_id": cve_id,
                "log_source": log_content,
                "severity": base_severity,
                "anomaly_score": anomaly_score,
                "threat_score": threat_score,
                "prediction": prediction,
                "recommendation": recommendation,
                "soc_level": level
            }
            insights.append(insight)

        with open(self.report_file, "w", encoding="utf-8") as f:
            json.dump(insights, f, indent=4, ensure_ascii=False)

        return f"Analyse terminée : {len(insights)} menaces détectées"

    def generate_live_traffic(self, count=5):
        """
        Simule des paquets réseau en temps réel avec des scores d'anomalies.
        """

        protocols = ["TCP", "UDP", "HTTP", "HTTPS", "ICMP", "SSH", "FTP"]
        source_ips = ["192.168.1.10", "10.0.0.5", "172.16.2.30", "45.78.1.12", "185.23.4.99", "8.8.8.8"]
        dest_ips = ["192.168.1.1", "10.0.0.1", "172.16.1.100"]

        packets = []
        for _ in range(count):
            proto = random.choice(protocols)
            src = random.choice(source_ips)
            dst = random.choice(dest_ips)
            size = random.randint(40, 1500)
            
            # Simple heuristic for risk score
            risk_score = 0
            alert_msg = "Normal"
            
            # Simulate anomalies
            if src in ["45.78.1.12", "185.23.4.99"] or proto == "SSH" and random.random() > 0.8:
                risk_score = random.uniform(7.0, 9.8)
                alert_msg = "Attaque Brute-Force suspectée" if proto == "SSH" else "IP source sur liste noire"
            elif size > 1400 and proto == "ICMP":
                risk_score = random.uniform(6.0, 8.5)
                alert_msg = "Ping of Death suspecté"
            else:
                risk_score = random.uniform(0.1, 3.5)

            packets.append({
                "timestamp": time.strftime("%H:%M:%S"),
                "source": src,
                "destination": dst,
                "protocol": proto,
                "size": f"{size}B",
                "risk_score": round(risk_score, 2),
                "verdict": alert_msg
            })

        return packets

    def analyze_ip(self, ip):
        """
        Analyse une adresse IP pour déterminer sa réputation et sa localisation (mock).
        """
        import random
        
        # Simple simulation based on IP parts
        parts = ip.split('.')
        is_valid = len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts)
        
        if not is_valid:
            return {"error": "Format d'adresse IP invalide."}

        # IP Reputation mock logic
        last_digit = int(parts[-1])
        
        reputation = "Clean"
        risk_score = random.randint(0, 15)
        threat_types = []
        recommendation = "Aucune action requise."
        
        if last_digit % 7 == 0:
            reputation = "Malicious"
            risk_score = random.randint(85, 99)
            threat_types = ["Botnet C2", "DDoS Source"]
            recommendation = "Bloquer immédiatement sur tous les pare-feu."
        elif last_digit % 3 == 0:
            reputation = "Suspicious"
            risk_score = random.randint(40, 75)
            threat_types = ["Anonymous Proxy", "SSH Brute Force"]
            recommendation = "Surveiller étroitement le trafic en provenance de cette IP."

        # Mock Geo data
        countries = ["United States", "China", "Russia", "Germany", "France", "Brazil", "Morocco"]
        isps = ["Cloudflare", "DigitalOcean", "Amazon Data Services", "Comcast", "IA Maroc"]
        
        country = countries[last_digit % len(countries)]
        isp = isps[last_digit % len(isps)]

        return {
            "ip": ip,
            "reputation": reputation,
            "risk_score": risk_score,
            "geo": {
                "country": country,
                "city": "Unknown City",
                "isp": isp
            },
            "threat_types": threat_types,
            "recommendation": recommendation,
            "last_seen": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    def analyze_context(self, analysis_type, content):
        """
        AI-DRIVEN VIRTUAL DETONATION:
        Analyzes a suspicious email, header, or binary context using a SOC Tier 3 Expert LLM.
        """
        
        system_prompt = """
        Tu es un expert en analyse de menaces mail et en ingénierie sociale (SOC Tier 3).
        Ta mission est de réaliser une "détonation virtuelle" d'un contenu suspect (corps de mail ou headers).
        
        Règles d'analyse :
        1. Heuristique : Détecte l'urgence, les menaces, les demandes de credentials ou de transferts d'argent.
        2. Technique : Analyse les liens (typosquattage) et les headers (si fournis : SPF, DKIM, DMARC).
        3. Verdict : Donne une décision claire : [CLEAN, SUSPICIOUS, MALICIOUS].
        4. Standard : Réponds UNIQUEMENT en JSON pur. No explanations.
        """
        
        user_prompt = f"""
        Tâche : Analyse le contenu suivant pour détecter une tentative de phishing ou de malware.
        
        CONTENU À DÉTONNER :
        {content[:10000]}

        Schéma JSON attendu :
        {{
          "verdict": "CLEAN|SUSPICIOUS|MALICIOUS",
          "threat_level": 0-100,
          "confidence_score": 0-100,
          "tlp_label": "TLP:RED|TLP:AMBER|TLP:GREEN|TLP:CLEAR",
          "analysis": {{
            "subject_risk": "Analyse du ton et de l'urgence",
            "social_engineering_tactics": ["Urgency", "Authority", "Fear", "Greed"],
            "detected_indicators": ["Liste des éléments suspects trouvés"]
          }},
          "extracted_artifacts": [
            {{
              "value": "URL ou Email",
              "type": "url|email|ip",
              "risk": "High|Medium|Low"
            }}
          ],
          "recommendation": "Action immédiate pour l'utilisateur"
        }}
        """

        try:
            # Execute AI Detonation
            response = self.llm.invoke(f"{system_prompt}\n\n{user_prompt}")
            
            # Extract JSON
            json_match = self.re.search(r'\{.*\}', response, self.re.DOTALL)
            if not json_match:
                # Fallback to a error structure that's still JSON
                return {"error": "AI Detonation failed to return valid JSON.", "raw_response": response[:500]}
                
            detonation_result = json.loads(json_match.group(0))
            
            # Consistency and Enrichment for UI
            detonation_result.update({
                "status": "Completed",
                "timestamp": datetime.now().isoformat(),
                "type": f"AI {analysis_type.capitalize()} Detonation",
                # Support for legacy risk_score field if needed by frontend
                "risk_score": detonation_result.get("threat_level", 0)
            })
            
            return detonation_result
            
        except Exception as e:
            return {"error": f"Detonation process crashed: {str(e)}"}
        
        
        return {"error": "Type d'analyse inconnu."}

    def analyze_malware(self, text_content, filename):
        """
        AI-DRIVEN MALWARE ANALYSIS:
        Analyzes extracted strings/code from a file to identify malware characteristics.
        """
        
        system_prompt = """
        Tu es un expert en Reverse Engineering et Forensic Malware. Ta mission est d'analyser les artefacts extraits d'un fichier suspect pour identifier des indicateurs de malveillance.
        
        Règles d'analyse :
        1. Identifie les fonctions suspectes (ex: eval(), base64, PowerShell, RegWrite).
        2. Détecte les tentatives d'obfuscation.
        3. Mappe les comportements sur les tactiques MITRE ATT&CK.
        4. Réponds UNIQUEMENT en JSON pur. No explanations.
        """
        
        user_prompt = f"""
        Tâche : Analyse ces artefacts extraits d'un fichier/script suspect nommé '{filename}'.
        
        ARTEFACTS À ANALYSER :
        {text_content[:8000]}

        Schéma JSON attendu :
        {{
          "verdict": "MALICIOUS|SUSPICIOUS|CLEAN",
          "malware_family": "Nom probable ou type (ex: Trojan, Stealer, Ransomware)",
          "risk_score": 0-100,
          "mitre_attack": [
            {{"tactic": "Execution", "technique": "Command and Scripting Interpreter", "id": "T1059"}}
          ],
          "suspicious_indicators": [
            {{"artifact": "valeur", "reason": "pourquoi c'est suspect"}}
          ],
          "iocs": {{
            "ips": [], "domains": [], "hashes": []
          }},
          "summary": "Analyse technique concise"
        }}
        """

        try:
            # Execute AI Malware Analysis
            response = self.llm.invoke(f"{system_prompt}\n\n{user_prompt}")
            
            # Extract JSON
            json_match = self.re.search(r'\{.*\}', response, self.re.DOTALL)
            if not json_match:
                return {"error": "AI Malware Analysis failed to return valid JSON.", "raw_response": response[:500]}
                
            analysis_result = json.loads(json_match.group(0))
            
            # Consistency and Enrichment
            analysis_result.update({
                "status": "Completed",
                "timestamp": datetime.now().isoformat(),
                "file_analyzed": filename
            })
            
            return analysis_result
            
        except Exception as e:
            return {"error": f"Malware analysis process crashed: {str(e)}"}
        
    def get_playbooks(self):
        """
        Liste des scénarios d'incidents disponibles.
        """
        return [
            {
                "id": "ransomware",
                "title": "Ransomware Containment",
                "category": "Critical",
                "duration": "4-8h",
                "description": "Procédure d'urgence pour isoler les hôtes infectés par un ransomware et stopper l'exfiltration."
            },
            {
                "id": "phishing",
                "title": "Credential Harvest Response",
                "category": "High",
                "duration": "1-2h",
                "description": "Réponse rapide à une campagne de phishing visant le vol d'identifiants."
            },
            {
                "id": "brute-force",
                "title": "SSH/RDP Brute Force",
                "category": "Medium",
                "duration": "30m",
                "description": "Atténuation d'une attaque de force brute sur les services d'accès distant."
            }
        ]

    def get_playbook_steps(self, playbook_id):
        """
        Détails des étapes pour un playbook spécifique (NIST SP 800-61).
        """
        playbooks_data = {
            "ransomware": [
                {
                    "phase": "Identification",
                    "tasks": [
                        {"id": "r1", "title": "Identifier le point d'entrée", "advice": "Analysez les logs EDR pour trouver le processus initial (souvent un email ou un hacktool)."},
                        {"id": "r2", "title": "Lister les partages réseau impactés", "advice": "Vérifiez les accès SMB inhabituels depuis l'hôte infecté."}
                    ]
                },
                {
                    "phase": "Containment",
                    "tasks": [
                        {"id": "r3", "title": "Isoler les hôtes du réseau", "advice": "Utilisez l'isolation réseau au niveau Switch ou Firewall."},
                        {"id": "r4", "title": "Désactiver les comptes compromis", "advice": "Réinitialisez les mots de passe Active Directory immédiatement."}
                    ]
                },
                {
                    "phase": "Recovery",
                    "tasks": [
                        {"id": "r5", "title": "Restaurer via backups immuables", "advice": "Vérifiez l'intégrité des sauvegardes avant restauration."},
                        {"id": "r6", "title": "Patching des vulnérabilités", "advice": "Appliquez les derniers correctifs pour éviter une réinfection."}
                    ]
                }
            ],
            "phishing": [
                 {
                    "phase": "Identification",
                    "tasks": [
                        {"id": "p1", "title": "Extraire les URLs malveillantes", "advice": "Utilisez CyberChef pour décoder les URLs obfusquées."},
                        {"id": "p2", "title": "Lister les victimes potentielles", "advice": "Cherchez qui a ouvert l'email ou cliqué sur le lien."}
                    ]
                },
                {
                    "phase": "Cleanup",
                    "tasks": [
                        {"id": "p3", "title": "Purge des boîtes mail", "advice": "Supprimez l'email de tous les serveurs Exchange ou O365."},
                        {"id": "p4", "title": "Blocage des domaines", "advice": "Ajoutez les domaines détectés à la Blacklist DNS."}
                    ]
                }
            ],
            "brute-force": [
                {
                    "phase": "Mitigation",
                    "tasks": [
                        {"id": "bf1", "title": "Identifier l'IP source", "advice": "Consultez les échecs de connexion répétés dans les journaux d'audit."},
                        {"id": "bf2", "title": "Bloquer l'IP au niveau local", "advice": "Ajoutez l'IP à la politique de restriction de l'hôte (Fail2Ban/Windows FW)."}
                    ]
                },
                {
                    "phase": "Hardening",
                    "tasks": [
                        {"id": "bf3", "title": "Activer le MFA", "advice": "Forcez l'authentification multi-facteurs pour tous les accès distants."},
                        {"id": "bf4", "title": "Changer le port par défaut", "advice": "Modifiez le port d'écoute standard pour réduire le bruit de fond."}
                    ]
                }
            ]
        }
        
        return playbooks_data.get(playbook_id, [])

if __name__ == "__main__":

    engine = AIEngine()
    print(engine.analyze_alerts())