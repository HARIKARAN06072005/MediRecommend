/**
 * Drug Database for MediRecommend System
 * Contains health conditions, medications, interactions, and alternatives
 */

// Database of health conditions and their primary recommended medications
const healthConditionsDB = {
  "hypertension": {
    primaryDrug: "Lisinopril",
    description: "An ACE inhibitor used to treat high blood pressure",
    dosage: "10-40 mg daily",
    precautions: "Monitor kidney function and potassium levels"
  },
  "diabetes": {
    primaryDrug: "Metformin",
    description: "First-line medication for type 2 diabetes",
    dosage: "500-2000 mg daily, divided doses",
    precautions: "Take with food to minimize gastrointestinal side effects"
  },
  "depression": {
    primaryDrug: "Sertraline",
    description: "SSRI antidepressant medication",
    dosage: "50-200 mg daily",
    precautions: "May take several weeks to see full benefits"
  },
  "anxiety": {
    primaryDrug: "Buspirone",
    description: "Anti-anxiety medication that doesn't cause dependence",
    dosage: "15-30 mg daily, divided doses",
    precautions: "Avoid alcohol while taking this medication"
  },
  "insomnia": {
    primaryDrug: "Zolpidem",
    description: "Sleep medication for short-term treatment of insomnia",
    dosage: "5-10 mg at bedtime",
    precautions: "Take immediately before bedtime; may cause drowsiness"
  },
  "asthma": {
    primaryDrug: "Albuterol",
    description: "Bronchodilator that relaxes muscles in the airways",
    dosage: "2 puffs every 4-6 hours as needed",
    precautions: "Overuse may lead to decreased effectiveness"
  },
  "allergies": {
    primaryDrug: "Cetirizine",
    description: "Non-drowsy antihistamine for allergy symptoms",
    dosage: "10 mg once daily",
    precautions: "May still cause drowsiness in some individuals"
  },
  "migraine": {
    primaryDrug: "Sumatriptan",
    description: "Triptan medication that treats migraine attacks",
    dosage: "50-100 mg at onset of migraine",
    precautions: "Don't use with certain antidepressants"
  },
  "gerd": {
    primaryDrug: "Omeprazole",
    description: "Proton pump inhibitor that reduces stomach acid",
    dosage: "20 mg daily before breakfast",
    precautions: "Long-term use may increase risk of certain infections"
  },
  "hypercholesterolemia": {
    primaryDrug: "Atorvastatin",
    description: "Statin medication to lower cholesterol levels",
    dosage: "10-80 mg daily at bedtime",
    precautions: "May cause muscle pain or weakness"
  }
};

// Database of alternative medications for each condition
const alternativeMedicationsDB = {
  "hypertension": [
    "Amlodipine", 
    "Losartan", 
    "Hydrochlorothiazide", 
    "Metoprolol"
  ],
  "diabetes": [
    "Glyburide", 
    "Glipizide", 
    "Sitagliptin", 
    "Empagliflozin"
  ],
  "depression": [
    "Fluoxetine", 
    "Escitalopram", 
    "Venlafaxine", 
    "Bupropion"
  ],
  "anxiety": [
    "Lorazepam", 
    "Alprazolam", 
    "Escitalopram", 
    "Venlafaxine"
  ],
  "insomnia": [
    "Eszopiclone", 
    "Melatonin", 
    "Doxepin", 
    "Trazodone"
  ],
  "asthma": [
    "Fluticasone", 
    "Montelukast", 
    "Budesonide", 
    "Formoterol"
  ],
  "allergies": [
    "Loratadine", 
    "Fexofenadine", 
    "Desloratadine", 
    "Diphenhydramine"
  ],
  "migraine": [
    "Rizatriptan", 
    "Propranolol", 
    "Topiramate", 
    "Amitriptyline"
  ],
  "gerd": [
    "Pantoprazole", 
    "Famotidine", 
    "Ranitidine", 
    "Lansoprazole"
  ],
  "hypercholesterolemia": [
    "Rosuvastatin", 
    "Simvastatin", 
    "Pravastatin", 
    "Ezetimibe"
  ]
};

// Database of dangerous drug interactions
const drugInteractionsDB = {
  // Format: "Drug1,Drug2": { severity: "low|medium|high", description: "Details about the interaction" }
  "Lisinopril,Spironolactone": { 
    severity: "medium", 
    description: "May increase risk of hyperkalemia (high potassium levels)" 
  },
  "Metformin,Iodinated contrast": { 
    severity: "high", 
    description: "May cause lactic acidosis, a dangerous condition" 
  },
  "Warfarin,Aspirin": { 
    severity: "high", 
    description: "Significantly increases bleeding risk" 
  },
  "Aspirin,Albuterol": { 
    severity: "high", 
    description: "Aspirin should NOT be used by people with asthma. It can trigger bronchospasm and serious respiratory problems." 
  },
  "Sertraline,Tramadol": { 
    severity: "medium", 
    description: "May increase risk of serotonin syndrome" 
  },
  "Sumatriptan,Fluoxetine": { 
    severity: "medium", 
    description: "May increase risk of serotonin syndrome"
  },
  "Alprazolam,Alcohol": { 
    severity: "high", 
    description: "Can cause dangerous levels of sedation and respiratory depression" 
  },
  "Simvastatin,Clarithromycin": { 
    severity: "high", 
    description: "Increases risk of muscle damage and rhabdomyolysis" 
  },
  "Sildenafil,Nitroglycerin": { 
    severity: "high", 
    description: "Can cause severe hypotension (low blood pressure)" 
  },
  "Theophylline,Ciprofloxacin": { 
    severity: "medium", 
    description: "May increase theophylline levels and risk of toxicity" 
  },
  "Methotrexate,NSAIDs": { 
    severity: "medium", 
    description: "May increase methotrexate levels and toxicity" 
  },
  "ACE inhibitors,ARBs": { 
    severity: "medium", 
    description: "Increased risk of kidney injury and hyperkalemia" 
  },
  "Digoxin,Amiodarone": { 
    severity: "medium", 
    description: "Increases digoxin levels with risk of toxicity" 
  }
};

// Drug classes for checking class-level interactions
const drugClasses = {
  "ACE inhibitors": ["Lisinopril", "Enalapril", "Ramipril", "Benazepril"],
  "ARBs": ["Losartan", "Valsartan", "Irbesartan", "Candesartan"],
  "NSAIDs": ["Ibuprofen", "Naproxen", "Celecoxib", "Diclofenac"],
  "Statins": ["Atorvastatin", "Simvastatin", "Rosuvastatin", "Pravastatin"],
  "SSRIs": ["Sertraline", "Fluoxetine", "Escitalopram", "Paroxetine"],
  "Benzodiazepines": ["Alprazolam", "Lorazepam", "Diazepam", "Clonazepam"]
};

// Age-specific medication considerations
const ageConsiderations = {
  "elderly": {
    "Benzodiazepines": "Use with caution; increased risk of falls and cognitive impairment",
    "NSAIDs": "Higher risk of GI bleeding and kidney injury; use lowest effective dose",
    "Anticholinergics": "May cause confusion, memory problems, and urinary retention",
    "Zolpidem": "Use lower doses (5mg) due to increased sensitivity"
  },
  "pediatric": {
    "Tetracyclines": "Avoid in children under 8 years; may affect bone development",
    "Aspirin": "Avoid in children and teenagers with viral illness; risk of Reye's syndrome",
    "Fluoroquinolones": "Generally not recommended due to risk of tendon damage"
  },
  "adult": {
    "Aspirin": "Avoid in patients with asthma; can trigger bronchospasm and serious respiratory problems"
  }
};

// Gender-specific medication considerations
const genderConsiderations = {
  "female": {
    "ACE inhibitors": "Contraindicated during pregnancy; can cause fetal harm",
    "Statins": "Contraindicated during pregnancy; use effective contraception",
    "Warfarin": "Requires close monitoring during menstruation; may increase bleeding"
  },
  "male": {
    "Finasteride": "Can affect PSA levels; inform doctor before prostate cancer screening",
    "Spironolactone": "May cause gynecomastia (enlarged breast tissue) in men"
  }
};

// Function to normalize drug names (lowercase, remove spaces)
function normalizeCondition(condition) {
  return condition.toLowerCase().trim();
}

// Function to normalize drug names (lowercase, remove spaces)
function normalizeDrugName(drugName) {
  return drugName.toLowerCase().trim();
}

// Function to check if a given drug belongs to a drug class
function getDrugClass(drugName) {
  const normalizedDrug = normalizeDrugName(drugName);
  for (const [className, drugs] of Object.entries(drugClasses)) {
    if (drugs.some(drug => normalizeDrugName(drug) === normalizedDrug)) {
      return className;
    }
  }
  return null;
}

// Function to get age category
function getAgeCategory(age) {
  if (age < 18) return "pediatric";
  if (age >= 65) return "elderly";
  return "adult";
}
