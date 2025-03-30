from flask import Flask, render_template, send_from_directory, request, jsonify
import os
import json
import re
from datetime import datetime

app = Flask(__name__)

# AI recommendation data
condition_symptoms = {
    "hypertension": ["headache", "shortness of breath", "nosebleeds", "dizziness", "chest pain", "high blood pressure", "vision problems"],
    "diabetes": ["frequent urination", "increased thirst", "hunger", "fatigue", "blurred vision", "slow-healing sores", "weight loss"],
    "depression": ["persistent sadness", "loss of interest", "changes in sleep", "fatigue", "anxiety", "reduced appetite", "trouble concentrating"],
    "anxiety": ["excessive worry", "restlessness", "fatigue", "difficulty concentrating", "irritability", "muscle tension", "sleep problems"],
    "insomnia": ["difficulty falling asleep", "waking up during the night", "waking too early", "daytime tiredness", "irritability", "difficulty focusing"],
    "asthma": ["shortness of breath", "chest tightness", "wheezing", "coughing", "trouble sleeping", "breathing problems"],
    "allergies": ["sneezing", "itching", "nasal congestion", "runny nose", "watery eyes", "skin rash", "hives"],
    "migraine": ["intense headache", "throbbing pain", "nausea", "vomiting", "sensitivity to light", "sensitivity to sound", "aura"],
    "gerd": ["heartburn", "chest pain", "difficulty swallowing", "regurgitation", "sour taste", "feeling of lump in throat"],
    "hypercholesterolemia": ["no symptoms typically", "high cholesterol levels", "family history of heart disease"]
}

medication_effectiveness = {
    "hypertension": {
        "Lisinopril": 0.85,
        "Amlodipine": 0.80,
        "Losartan": 0.82,
        "Hydrochlorothiazide": 0.75,
        "Metoprolol": 0.78
    },
    "diabetes": {
        "Metformin": 0.88,
        "Glyburide": 0.76,
        "Glipizide": 0.75,
        "Sitagliptin": 0.82,
        "Empagliflozin": 0.84
    },
    "depression": {
        "Sertraline": 0.83,
        "Fluoxetine": 0.81,
        "Escitalopram": 0.84,
        "Venlafaxine": 0.79,
        "Bupropion": 0.82
    },
    "anxiety": {
        "Buspirone": 0.78,
        "Lorazepam": 0.82,
        "Alprazolam": 0.85,
        "Escitalopram": 0.80,
        "Venlafaxine": 0.77
    },
    "insomnia": {
        "Zolpidem": 0.84,
        "Eszopiclone": 0.82,
        "Melatonin": 0.70,
        "Doxepin": 0.75,
        "Trazodone": 0.78
    },
    "asthma": {
        "Albuterol": 0.88,
        "Fluticasone": 0.85,
        "Montelukast": 0.82,
        "Budesonide": 0.83,
        "Formoterol": 0.81
    },
    "allergies": {
        "Cetirizine": 0.85,
        "Loratadine": 0.82,
        "Fexofenadine": 0.84,
        "Desloratadine": 0.81,
        "Diphenhydramine": 0.78
    },
    "migraine": {
        "Sumatriptan": 0.86,
        "Rizatriptan": 0.84,
        "Propranolol": 0.80,
        "Topiramate": 0.82,
        "Amitriptyline": 0.79
    },
    "gerd": {
        "Omeprazole": 0.87,
        "Pantoprazole": 0.85,
        "Famotidine": 0.81,
        "Ranitidine": 0.78,
        "Lansoprazole": 0.84
    },
    "hypercholesterolemia": {
        "Atorvastatin": 0.88,
        "Rosuvastatin": 0.89,
        "Simvastatin": 0.85,
        "Pravastatin": 0.82,
        "Ezetimibe": 0.79
    }
}

# AI recommendation functions
def analyze_symptoms(symptom_text):
    """Use enhanced NLP to analyze patient-described symptoms and match to conditions"""
    if not symptom_text:
        return None
    
    # Normalize text: lowercase, remove punctuation
    text = symptom_text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    words = text.split()
    
    # Enhanced processing with context awareness
    # Add common symptom synonyms and related terms
    symptom_synonyms = {
        "headache": ["head pain", "migraine", "tension headache", "head pressure", "throbbing head"],
        "nausea": ["sick to stomach", "feel like vomiting", "queasy", "upset stomach"],
        "fatigue": ["tired", "exhaustion", "lethargy", "lack of energy", "exhausted", "weary"],
        "dizziness": ["lightheaded", "vertigo", "feeling faint", "spinning", "unsteady"],
        "pain": ["ache", "discomfort", "soreness", "hurt", "aching", "tender"],
        "rash": ["hives", "skin eruption", "breakout", "skin irritation", "dermatitis"],
        "fever": ["high temperature", "elevated temperature", "hot", "feverish", "running a temperature"],
        "cough": ["hack", "wheeze", "barking", "persistent cough", "dry cough"],
        "shortness of breath": ["difficulty breathing", "breathlessness", "can't catch breath", "labored breathing", "dyspnea"]
    }
    
    # Expand text with recognized synonyms
    expanded_text = text
    for main_symptom, synonyms in symptom_synonyms.items():
        for synonym in synonyms:
            if synonym in text:
                expanded_text += f" {main_symptom}"
    
    # Calculate match scores for each condition based on symptom keywords
    condition_scores = {}
    for condition, symptoms in condition_symptoms.items():
        score = 0
        matched_symptoms = []
        
        for symptom in symptoms:
            # Check if symptom phrase is in text
            if symptom in expanded_text:
                score += 1
                matched_symptoms.append(symptom)
            else:
                # Check individual words in symptom phrase with weighting
                symptom_words = symptom.split()
                word_matched = False
                
                for word in symptom_words:
                    if word in words and len(word) > 3:  # Only match significant words
                        # More weight for specific medical terms
                        if word in ["severe", "chronic", "acute", "recurring", "persistent"]:
                            score += 0.7
                        else:
                            score += 0.5
                        
                        if not word_matched:
                            matched_symptoms.append(symptom)
                            word_matched = True
        
        # Apply condition-specific contextual analysis
        if condition == "hypertension" and any(w in expanded_text for w in ["pressure", "high", "stress", "heart"]):
            score += 0.5
        elif condition == "diabetes" and any(w in expanded_text for w in ["sugar", "thirsty", "glucose", "insulin"]):
            score += 0.5
        elif condition == "asthma" and any(w in expanded_text for w in ["breath", "chest", "wheeze", "trigger"]):
            score += 0.5
        
        # Apply advanced scoring factors based on symptom co-occurrence
        symptom_count = len(matched_symptoms)
        if symptom_count >= 3:  # Multiple matching symptoms strongly suggest a condition
            score += 1.0
        
        # Calculate percentage match with improved algorithm
        if symptoms:
            # Base score from symptom matching
            base_score = score / len(symptoms) * 100
            
            # Adjust based on the number of matched symptoms (to give higher confidence for multiple matches)
            adjustment = min(20, symptom_count * 5)  # Up to 20% bonus
            
            condition_scores[condition] = {
                "score": min(98, base_score + adjustment),  # Cap at 98% to acknowledge uncertainty
                "matched_symptoms": list(set(matched_symptoms))  # Remove duplicates
            }
    
    # Sort conditions by score
    sorted_conditions = sorted(condition_scores.items(), key=lambda x: x[1]["score"], reverse=True)
    
    # Return top matches if they meet a minimum threshold (25%)
    top_matches = [{"condition": cond, "match_data": data} 
                  for cond, data in sorted_conditions if data["score"] >= 25]
    
    return top_matches[:3] if top_matches else None  # Return top 3 matches or None

def get_ai_recommendation(health_condition, gender, age, existing_drug=None, symptom_text=None):
    """Generate AI-powered medication recommendation with advanced personalization and safety analysis"""
    # Default to the provided health condition
    primary_condition = health_condition.lower() if health_condition else ""
    
    # If symptom text is provided, use enhanced NLP to analyze and suggest conditions
    suggested_conditions = None
    if symptom_text:
        suggested_conditions = analyze_symptoms(symptom_text)
        
        # If we found strong symptom matches and the user didn't specify a condition,
        # use the top matched condition
        if suggested_conditions and (not health_condition or health_condition.lower() == "unknown"):
            primary_condition = suggested_conditions[0]["condition"]
    
    # Get medication effectiveness for this condition
    effectiveness_data = medication_effectiveness.get(primary_condition, {})
    
    # If no valid condition or no medication data, provide a meaningful response
    if not primary_condition or not effectiveness_data:
        return {
            "timestamp": datetime.now().isoformat(),
            "error": True,
            "message": "Could not determine a valid health condition for medication recommendation.",
            "ai_analysis": {
                "is_ai_enhanced": True,
                "symptom_analysis": suggested_conditions if suggested_conditions else None
            }
        }
    
    # Sort medications by effectiveness
    sorted_medications = sorted(effectiveness_data.items(), key=lambda x: x[1], reverse=True)
    
    # Check for dangerous combinations and contraindications
    has_dangerous_interaction = False
    interaction_warning = None
    alternative_medication = None
    safety_notes = []
    
    # Define comprehensive drug interactions and contraindications
    dangerous_combinations = {
        ("asthma", "aspirin"): "Aspirin should NOT be used by people with asthma. It can trigger bronchospasm and serious respiratory problems.",
        ("hypertension", "ibuprofen"): "NSAIDs like ibuprofen may increase blood pressure and reduce effectiveness of hypertension medications.",
        ("anxiety", "caffeine"): "Caffeine can worsen anxiety symptoms and reduce the effectiveness of anxiety medications.",
        ("gerd", "aspirin"): "Aspirin and other NSAIDs can worsen GERD symptoms by irritating the esophagus and stomach lining.",
        ("depression", "alcohol"): "Alcohol is a depressant and can worsen depression symptoms and interact with antidepressants."
    }
    
    # Check for specific dangerous combinations
    if existing_drug:
        existing_drug_lower = existing_drug.lower()
        combination_key = (primary_condition, existing_drug_lower)
        
        if combination_key in dangerous_combinations:
            has_dangerous_interaction = True
            interaction_warning = dangerous_combinations[combination_key]
            # Suggest alternative (first medication that's not the dangerous one)
            if sorted_medications:
                alternative_medication = sorted_medications[0][0]
        
        # Additional general safety checks
        if "warfarin" in existing_drug_lower and any(m for m, _ in sorted_medications if "nsaid" in m.lower() or "aspirin" in m.lower()):
            safety_notes.append("Warfarin with NSAIDs or aspirin increases bleeding risk.")
        
        if "ssri" in existing_drug_lower and any(m for m, _ in sorted_medications if "maoi" in m.lower()):
            safety_notes.append("SSRIs with MAOIs can cause serotonin syndrome, a potentially life-threatening condition.")
    
    # Personalize recommendation based on age and gender with enhanced adjustments
    age_category = "adult"
    if int(age) < 18:
        age_category = "pediatric"
    elif int(age) >= 65:
        age_category = "elderly"
    
    # More comprehensive age-specific adjustments
    age_adjustment = {
        "elderly": {
            "Benzodiazepines": -0.25,  # Higher risk of falls and cognitive impairment
            "NSAIDs": -0.20,  # Increased risk of GI bleeding and kidney problems
            "Zolpidem": -0.15,  # Higher risk of falls and confusion
            "Anticholinergics": -0.25,  # Increased risk of confusion, memory problems
            "Insulin": -0.10,  # Risk of hypoglycemia
            "Warfarin": -0.10,  # Increased bleeding risk
            "Muscle relaxants": -0.20,  # Increased sedation risk
            "Statins": -0.05,  # Consider lower doses
            "Digoxin": -0.15,  # Narrow therapeutic window
            "Antipsychotics": -0.25  # Risk of stroke in dementia patients
        },
        "pediatric": {
            "Tetracyclines": -0.70,  # Can affect bone growth in children
            "Aspirin": -0.80,  # Risk of Reye's syndrome
            "Fluoroquinolones": -0.70,  # Can affect cartilage development
            "Statins": -0.70,  # Generally not recommended
            "ACE inhibitors": -0.60,  # Caution in growing children
            "Adult-strength formulations": -0.50,  # Need pediatric dosing
            "Dextromethorphan": -0.30,  # Use caution in young children
            "Codeine": -0.60  # Respiratory concerns in young children
        },
        "adult": {
            "Pediatric formulations": -0.50,  # Inadequate dosing
            "Geriatric-specific medications": -0.30  # May not be appropriate
        }
    }
    
    # Enhanced gender-specific adjustments
    gender_adjustment = {
        "female": {
            "ACE inhibitors": -0.15,  # Potential teratogenic effects in pregnancy
            "Statins": -0.10,  # Caution in women who may become pregnant
            "Warfarin": -0.15,  # Teratogenic risk in pregnancy
            "Valproate": -0.20,  # Teratogenic risk and PCOS association
            "Finasteride": -0.90,  # Not indicated, risk in pregnancy
            "Sildenafil": -0.40,  # Less evidence for female use
            "Minoxidil": -0.20,  # Different dosing may be needed
            "Isotretinoin": -0.20  # Teratogenic risk
        },
        "male": {
            "Finasteride": 0.10,  # Used for male pattern baldness and BPH
            "Sildenafil": 0.10,  # More commonly prescribed
            "Tamsulosin": 0.15,  # Used for BPH
            "Spironolactone": -0.10,  # May cause gynecomastia
            "Estrogen medications": -0.90  # Generally not indicated
        },
        "other": {
            # Neutral adjustments
        }
    }
    
    # Add condition-specific factors
    condition_factor = {
        "hypertension": {"Diuretics": 0.1, "Calcium channel blockers": 0.1},
        "diabetes": {"Metformin": 0.1, "GLP-1 agonists": 0.1, "SGLT2 inhibitors": 0.1},
        "asthma": {"Inhaled corticosteroids": 0.1, "Long-acting beta agonists": 0.1},
        "depression": {"SSRIs": 0.1, "SNRIs": 0.05},
        "anxiety": {"SSRIs": 0.1, "Buspirone": 0.1},
        "insomnia": {"Melatonin": 0.05, "Cognitive behavioral therapy": 0.2}
    }
    
    # Build enhanced recommendation object
    recommendation = {
        "timestamp": datetime.now().isoformat(),
        "patient": {
            "gender": gender,
            "age": age,
            "age_category": age_category,
            "existing_medication": existing_drug if existing_drug else None
        },
        "primary_condition": primary_condition,
        "ai_analysis": {
            "is_ai_enhanced": True,
            "symptom_analysis": suggested_conditions if suggested_conditions else None,
            "certainty_level": "high" if suggested_conditions and suggested_conditions[0]["match_data"]["score"] > 70 else "moderate"
        },
        "recommendations": [],
        "safety": {
            "has_dangerous_interaction": has_dangerous_interaction,
            "interaction_warning": interaction_warning,
            "alternative_medication": alternative_medication,
            "safety_notes": safety_notes
        },
        "additional_recommendations": {
            "lifestyle_changes": get_lifestyle_recommendations(primary_condition),
            "monitoring": get_monitoring_recommendations(primary_condition)
        }
    }
    
    # Build personalized medication recommendations with confidence scoring
    for medication, base_score in sorted_medications[:3]:  # Top 3 medications
        score = base_score
        adjustments = []
        
        # Apply age adjustments
        if age_category in age_adjustment:
            for drug_class, adjustment in age_adjustment[age_category].items():
                if drug_class.lower() in medication.lower():
                    score += adjustment
                    adjustments.append({
                        "factor": f"Age category ({age_category})",
                        "adjustment": adjustment
                    })
        
        # Apply gender adjustments
        if gender in gender_adjustment:
            for drug_class, adjustment in gender_adjustment[gender].items():
                if drug_class.lower() in medication.lower():
                    score += adjustment
                    adjustments.append({
                        "factor": f"Gender ({gender})",
                        "adjustment": adjustment
                    })
        
        # Apply condition-specific adjustments
        if primary_condition in condition_factor:
            for drug_class, adjustment in condition_factor[primary_condition].items():
                if drug_class.lower() in medication.lower():
                    score += adjustment
                    adjustments.append({
                        "factor": f"Condition specific ({primary_condition})",
                        "adjustment": adjustment
                    })
        
        # Apply existing medication adjustment
        is_dangerous = False
        if existing_drug and has_dangerous_interaction and medication.lower() == existing_drug.lower():
            score -= 0.5
            is_dangerous = True
            adjustments.append({
                "factor": "Drug interaction",
                "adjustment": -0.5
            })
        
        # Cap score between 0 and 1
        score = max(0, min(1, score))
        
        medication_info = {
            "medication": medication,
            "confidence_score": round(score, 2),
            "is_dangerous_with_existing_medication": is_dangerous,
            "score_adjustments": adjustments,
            "dosing_guidance": get_dosing_guidance(medication, age_category, gender, primary_condition)
        }
        
        recommendation["recommendations"].append(medication_info)
    
    return recommendation

def get_lifestyle_recommendations(condition):
    """Get lifestyle change recommendations based on condition"""
    lifestyle_recommendations = {
        "hypertension": [
            "Reduce sodium intake to less than 2,300mg per day",
            "Regular aerobic exercise for 30 minutes most days",
            "Maintain healthy weight",
            "DASH diet rich in fruits, vegetables, and low-fat dairy",
            "Limit alcohol consumption"
        ],
        "diabetes": [
            "Regular blood glucose monitoring",
            "Balanced diet with controlled carbohydrate intake",
            "Regular physical activity for 150 minutes per week",
            "Maintain healthy weight",
            "Avoid smoking"
        ],
        "depression": [
            "Regular physical exercise",
            "Maintain regular sleep schedule",
            "Consider psychotherapy or counseling",
            "Social engagement and support networks",
            "Mindfulness and stress reduction techniques"
        ],
        "anxiety": [
            "Breathing exercises and meditation",
            "Regular physical activity",
            "Limit caffeine and alcohol",
            "Adequate sleep",
            "Consider cognitive behavioral therapy"
        ],
        "insomnia": [
            "Consistent sleep schedule",
            "Create relaxing bedtime routine",
            "Avoid screens before bed",
            "Make bedroom comfortable and dark",
            "Avoid caffeine and large meals before bed"
        ],
        "asthma": [
            "Identify and avoid triggers",
            "Use air purifiers at home",
            "Regular exercise with appropriate precautions",
            "Maintain healthy weight",
            "Annual flu vaccination"
        ],
        "allergies": [
            "Identify and avoid allergens",
            "HEPA filters for home",
            "Keep windows closed during high pollen seasons",
            "Regular cleaning to reduce dust and pet dander",
            "Consider allergen covers for bedding"
        ],
        "migraine": [
            "Identify and avoid personal triggers",
            "Maintain regular sleep and meal schedule",
            "Stress management techniques",
            "Stay hydrated",
            "Regular physical activity"
        ],
        "gerd": [
            "Avoid lying down after eating",
            "Elevate head of bed",
            "Avoid trigger foods (spicy, acidic, fatty)",
            "Smaller, more frequent meals",
            "Maintain healthy weight"
        ],
        "hypercholesterolemia": [
            "Mediterranean or DASH diet",
            "Regular physical activity",
            "Limit saturated and trans fats",
            "Increase fiber intake",
            "Maintain healthy weight"
        ]
    }
    
    return lifestyle_recommendations.get(condition, ["Maintain a balanced diet", "Regular physical activity", "Adequate sleep", "Stress management", "Regular medical check-ups"])

def get_monitoring_recommendations(condition):
    """Get monitoring recommendations based on condition"""
    monitoring_recommendations = {
        "hypertension": [
            "Regular blood pressure checks",
            "Monitor for medication side effects",
            "Periodic kidney function tests",
            "Regular physician follow-up",
            "Home blood pressure monitoring if recommended"
        ],
        "diabetes": [
            "Regular blood glucose monitoring",
            "HbA1c testing every 3-6 months",
            "Annual eye examination",
            "Regular foot examinations",
            "Kidney function monitoring"
        ],
        "depression": [
            "Regular follow-up with healthcare provider",
            "Monitor for side effects of medication",
            "Track mood changes",
            "Watch for warning signs of suicidal thoughts",
            "Evaluate effectiveness of treatment"
        ],
        "anxiety": [
            "Track anxiety symptoms and triggers",
            "Monitor response to medication",
            "Watch for side effects",
            "Regular therapy sessions if applicable",
            "Evaluate stress levels"
        ]
    }
    
    return monitoring_recommendations.get(condition, ["Regular follow-up with healthcare provider", "Monitor for medication side effects", "Track symptom changes", "Report any new symptoms promptly"])

def get_dosing_guidance(medication, age_category, gender, condition):
    """Provide basic dosing guidance based on medication and patient factors"""
    # This would be expanded with comprehensive medication-specific information
    standard_advice = f"Standard dosing of {medication} as prescribed by healthcare provider."
    
    # Example specific dosing guidance
    if age_category == "elderly":
        return f"Consider starting {medication} at lower dose (typically 50% of standard adult dose) and titrate slowly. Monitor closely for side effects."
    elif age_category == "pediatric":
        return f"Pediatric dosing of {medication} should be calculated based on weight. Consult pediatric dosing references."
    
    # Condition and medication specific advice
    if condition == "hypertension" and "diuretic" in medication.lower():
        return f"Start with low dose of {medication}, especially in elderly patients. Monitor electrolytes and kidney function."
    
    return standard_advice

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/analyze-symptoms', methods=['POST'])
def api_analyze_symptoms():
    """API endpoint to analyze symptoms"""
    data = request.json
    symptom_text = data.get('symptoms', '')
    
    results = analyze_symptoms(symptom_text)
    return jsonify({
        "success": True if results else False,
        "results": results
    })

@app.route('/api/ai-recommendation', methods=['POST'])
def api_ai_recommendation():
    """API endpoint to get AI-powered medication recommendation"""
    data = request.json
    health_condition = data.get('healthProblem', '')
    gender = data.get('gender', 'adult')
    age = data.get('age', 30)
    existing_drug = data.get('existingDrug', '')
    symptom_text = data.get('symptomText', '')
    
    recommendation = get_ai_recommendation(
        health_condition, 
        gender, 
        age, 
        existing_drug, 
        symptom_text
    )
    
    return jsonify({
        "success": True,
        "recommendation": recommendation
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)