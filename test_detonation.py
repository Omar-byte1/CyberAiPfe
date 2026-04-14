from backend.ai_engine import AIEngine
import json

# Test script for AI-Driven Virtual Detonation
def test_detonation():
    engine = AIEngine()
    
    # Sample Phishing Email Content
    email_content = """
    De: support@banc-security-alerts.com
    Objet: Action requise : Votre compte est suspendu
    
    Cher client,
    
    Nous avons détecté une activité suspecte sur votre compte bancaire. 
    Par mesure de sécurité, votre accès a été temporairement suspendu.
    
    Pour restaurer votre accès, veuillez cliquer sur le lien ci-dessous et confirmer vos identifiants :
    http://secure-login-banc-verify.top/auth/login
    
    Si vous n'effectuez pas cette action dans les 24 heures, votre compte sera définitivement clôturé.
    
    Cordialement,
    L'équipe de sécurité bancaire.
    """
    
    print("\n--- Testing Email Detonation ---")
    result = engine.analyze_context("email", email_content)
    print(json.dumps(result, indent=2))
    
    # Sample Header Content
    header_content = """
    Return-Path: <bounce-9283@evil-sender.net>
    Delivered-To: victim@company.com
    Received: from mail.evil-sender.net (mail.evil-sender.net [185.123.45.67])
            by mx.google.com with ESMTPS id ...
    Authentication-Results: mx.google.com;
           spf=fail (google.com: domain of bounce-9283@evil-sender.net does not designate 185.123.45.67 as permitted sender)
           dkim=fail body hash did not verify
    From: "IT Support" <it.support@company-global.com>
    Subject: Patch security update - Urgent
    """
    
    print("\n--- Testing Header Detonation ---")
    result = engine.analyze_context("header", header_content)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_detonation()
