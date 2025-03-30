/**
 * MediRecommend - Drug Recommendation System
 * Main application logic
 */

document.addEventListener('DOMContentLoaded', function() {
  // Form elements
  const recommendationForm = document.getElementById('recommendationForm');
  const healthProblemInput = document.getElementById('healthProblem');
  const symptomTextInput = document.getElementById('symptomText');
  const genderSelect = document.getElementById('gender');
  const ageInput = document.getElementById('age');
  const existingDrugInput = document.getElementById('existingDrug');
  const clearFormBtn = document.getElementById('clearFormBtn');
  const analyzeSymptomBtn = document.getElementById('analyzeSymptomBtn');
  
  // Autocomplete elements
  const healthConditionResults = document.getElementById('healthConditionResults');
  const medicationResults = document.getElementById('medicationResults');
  
  // Output and UI elements
  const outputContainer = document.getElementById('output');
  const symptomAnalysisContainer = document.getElementById('symptomAnalysis');
  const aiConfidenceVisualization = document.getElementById('aiConfidenceVisualization');
  const loader = document.getElementById('loader');
  const savedRecommendations = document.getElementById('savedRecommendations');
  const savedRecommendationsList = document.getElementById('savedRecommendationsList');
  
  // Error message elements
  const healthProblemError = document.getElementById('healthProblemError');
  const genderError = document.getElementById('genderError');
  const ageError = document.getElementById('ageError');
  
  // Current recommendation being displayed
  let currentRecommendation = null;
  let currentSymptomAnalysis = null;
  
  // Load saved recommendations from localStorage
  let savedRecommendationsData = loadSavedRecommendations();
  
  // Initialize features
  initializeTooltips();
  initializeAutocomplete();
  initializeFormFeedback();
  updateSavedRecommendationsList();
  
  // Show saved recommendations if any exist
  if (savedRecommendationsData.length > 0) {
    savedRecommendations.classList.add('show');
  }
  
  // Analyze symptoms button handler
  analyzeSymptomBtn.addEventListener('click', function() {
    const symptomText = symptomTextInput.value.trim();
    
    if (!symptomText) {
      alert('Please enter symptom description for analysis.');
      return;
    }
    
    showLoader();
    
    // Call the AI symptom analysis API
    fetch('/api/analyze-symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: symptomText })
    })
    .then(response => response.json())
    .then(data => {
      hideLoader();
      
      if (data.success && data.results && data.results.length > 0) {
        // Store the symptom analysis for later use
        currentSymptomAnalysis = data.results;
        
        // Display symptom analysis
        displaySymptomAnalysis(data.results);
      } else {
        symptomAnalysisContainer.innerHTML = `
          <div class="message warning">
            <i class="fas fa-exclamation-triangle"></i>
            Unable to identify clear conditions from the symptoms described. 
            Please provide more details or enter a condition manually.
          </div>
        `;
        symptomAnalysisContainer.classList.add('show');
      }
    })
    .catch(error => {
      console.error('Error analyzing symptoms:', error);
      hideLoader();
      alert('An error occurred while analyzing symptoms. Please try again.');
    });
  });
  
  // Display the symptom analysis results
  function displaySymptomAnalysis(results) {
    symptomAnalysisContainer.innerHTML = `
      <h4><i class="fas fa-stethoscope"></i> AI Condition Analysis</h4>
      <p>Based on the symptoms described, the AI has identified these potential conditions:</p>
      <div class="condition-matches"></div>
    `;
    
    const conditionMatchesContainer = symptomAnalysisContainer.querySelector('.condition-matches');
    
    results.forEach(result => {
      const conditionMatch = document.createElement('div');
      conditionMatch.className = 'condition-match';
      
      const scorePercentage = Math.round(result.match_data.score);
      
      let matchedSymptomsHtml = '';
      if (result.match_data.matched_symptoms && result.match_data.matched_symptoms.length > 0) {
        matchedSymptomsHtml = `
          <div class="matched-symptoms">
            ${result.match_data.matched_symptoms.map(symptom => 
              `<span class="symptom-tag">${symptom}</span>`
            ).join('')}
          </div>
        `;
      }
      
      conditionMatch.innerHTML = `
        <div class="condition-match-header">
          <div class="condition-name">${result.condition.charAt(0).toUpperCase() + result.condition.slice(1)}</div>
          <div class="match-score">${scorePercentage}% match</div>
        </div>
        ${matchedSymptomsHtml}
        <button class="use-condition-btn" data-condition="${result.condition}">
          <i class="fas fa-check"></i> Use this condition
        </button>
      `;
      
      conditionMatchesContainer.appendChild(conditionMatch);
    });
    
    // Add event listeners to the "Use this condition" buttons
    const useConditionButtons = symptomAnalysisContainer.querySelectorAll('.use-condition-btn');
    useConditionButtons.forEach(button => {
      button.addEventListener('click', function() {
        const condition = this.getAttribute('data-condition');
        healthProblemInput.value = condition.charAt(0).toUpperCase() + condition.slice(1);
        
        // Trigger input event to validate
        const inputEvent = new Event('input', { bubbles: true });
        healthProblemInput.dispatchEvent(inputEvent);
      });
    });
    
    symptomAnalysisContainer.classList.add('show');
  }
  
  // Form submission handler
  recommendationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearErrors();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Show loading indicator
    showLoader();
    
    // Get form values
    const healthProblem = healthProblemInput.value.trim();
    const symptomText = symptomTextInput.value.trim();
    const gender = genderSelect.value;
    const age = parseInt(ageInput.value);
    const existingDrug = existingDrugInput.value.trim();
    
    // Call the AI recommendation API
    fetch('/api/ai-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        healthProblem, 
        gender, 
        age, 
        existingDrug,
        symptomText
      })
    })
    .then(response => response.json())
    .then(data => {
      hideLoader();
      
      if (data.success && data.recommendation) {
        // Store the recommendation for possible saving
        currentRecommendation = data.recommendation;
        
        // Display AI recommendation
        displayAIRecommendation(data.recommendation);
      } else {
        outputContainer.innerHTML = `
          <div class="message warning">
            <i class="fas fa-exclamation-triangle"></i>
            Unable to generate recommendation. Please check your inputs and try again.
          </div>
        `;
        outputContainer.classList.add('show');
      }
    })
    .catch(error => {
      console.error('Error getting AI recommendation:', error);
      hideLoader();
      alert('An error occurred while generating recommendation. Please try again.');
    });
  });
  
  // Clear form button handler
  clearFormBtn.addEventListener('click', function() {
    clearForm();
    clearErrors();
    outputContainer.classList.remove('show');
    outputContainer.innerHTML = '';
    currentRecommendation = null;
  });
  
  // Input validation functions
  function validateForm() {
    let isValid = true;
    
    // Validate health problem
    if (!healthProblemInput.value.trim()) {
      displayError(healthProblemError, 'Please enter a health condition');
      isValid = false;
    } else if (!isValidHealthCondition(healthProblemInput.value.trim())) {
      displayError(healthProblemError, 'Please enter a valid health condition');
      isValid = false;
    }
    
    // Validate gender
    if (!genderSelect.value) {
      displayError(genderError, 'Please select your gender');
      isValid = false;
    }
    
    // Validate age
    if (!ageInput.value) {
      displayError(ageError, 'Please enter your age');
      isValid = false;
    } else if (ageInput.value < 0 || ageInput.value > 120) {
      displayError(ageError, 'Please enter a valid age (0-120)');
      isValid = false;
    }
    
    return isValid;
  }
  
  function isValidHealthCondition(condition) {
    // Check if condition exists in our database or is similar enough
    const normalizedCondition = normalizeCondition(condition);
    
    // Check for exact match
    if (Object.keys(healthConditionsDB).some(cond => normalizeCondition(cond) === normalizedCondition)) {
      return true;
    }
    
    // Check for partial match (condition contains a known condition)
    return Object.keys(healthConditionsDB).some(cond => 
      normalizedCondition.includes(normalizeCondition(cond)) || 
      normalizeCondition(cond).includes(normalizedCondition)
    );
  }
  
  function displayError(element, message) {
    element.textContent = message;
    element.parentElement.classList.add('error');
  }
  
  function clearErrors() {
    healthProblemError.textContent = '';
    genderError.textContent = '';
    ageError.textContent = '';
    
    healthProblemError.parentElement.classList.remove('error');
    genderError.parentElement.classList.remove('error');
    ageError.parentElement.classList.remove('error');
  }
  
  function clearForm() {
    healthProblemInput.value = '';
    genderSelect.selectedIndex = 0;
    ageInput.value = '';
    existingDrugInput.value = '';
  }
  
  // UI helper functions
  function showLoader() {
    loader.classList.add('show');
    outputContainer.classList.remove('show');
  }
  
  function hideLoader() {
    loader.classList.remove('show');
  }
  
  function initializeTooltips() {
    // Tooltips are CSS-based, no JS needed for basic functionality
  }
  
  // Enhanced Form Feedback
  function initializeFormFeedback() {
    // For health condition field
    healthProblemInput.addEventListener('input', function() {
      const inputValue = this.value.trim();
      const parentGroup = this.closest('.form-group');
      
      // Remove all class states
      parentGroup.classList.remove('typing', 'valid', 'error');
      
      if (inputValue) {
        if (isValidHealthCondition(inputValue)) {
          parentGroup.classList.add('valid');
        } else {
          parentGroup.classList.add('typing');
        }
      }
    });
    
    // For age field
    ageInput.addEventListener('input', function() {
      const inputValue = this.value.trim();
      const parentGroup = this.closest('.form-group');
      
      // Remove all class states
      parentGroup.classList.remove('typing', 'valid', 'error');
      
      if (inputValue) {
        const age = parseInt(inputValue);
        if (age >= 0 && age <= 120) {
          parentGroup.classList.add('valid');
        } else {
          parentGroup.classList.add('typing');
        }
      }
    });
    
    // For gender select field
    genderSelect.addEventListener('change', function() {
      const inputValue = this.value;
      const parentGroup = this.closest('.form-group');
      
      // Remove all class states
      parentGroup.classList.remove('valid', 'error');
      
      if (inputValue) {
        parentGroup.classList.add('valid');
      }
    });
  }
  
  // Autocomplete functionality
  function initializeAutocomplete() {
    // Health condition autocomplete
    initializeAutocompleteField(healthProblemInput, healthConditionResults, healthConditionsAutocomplete);
    
    // Medication autocomplete
    initializeAutocompleteField(existingDrugInput, medicationResults, medicationsAutocomplete);
  }
  
  function initializeAutocompleteField(inputField, resultsContainer, dataArray) {
    inputField.addEventListener('input', function() {
      const inputValue = this.value.trim().toLowerCase();
      
      // Clear previous results
      resultsContainer.innerHTML = '';
      
      // Hide results if input is empty
      if (!inputValue) {
        resultsContainer.classList.remove('show');
        return;
      }
      
      // Filter matching items
      const matchingItems = dataArray.filter(item => 
        item.toLowerCase().includes(inputValue)
      ).slice(0, 5); // Limit to top 5 matches
      
      // If no matches, hide results
      if (matchingItems.length === 0) {
        resultsContainer.classList.remove('show');
        return;
      }
      
      // Create results list
      matchingItems.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'autocomplete-item';
        
        // Highlight the matching part
        const itemText = item;
        const matchIndex = itemText.toLowerCase().indexOf(inputValue);
        
        if (matchIndex >= 0) {
          const beforeMatch = itemText.substring(0, matchIndex);
          const matchText = itemText.substring(matchIndex, matchIndex + inputValue.length);
          const afterMatch = itemText.substring(matchIndex + inputValue.length);
          
          resultItem.innerHTML = `${beforeMatch}<span class="autocomplete-highlight">${matchText}</span>${afterMatch}`;
        } else {
          resultItem.textContent = itemText;
        }
        
        // Add click event to select this item
        resultItem.addEventListener('click', function() {
          inputField.value = itemText;
          resultsContainer.classList.remove('show');
          
          // Trigger input event to validate
          const inputEvent = new Event('input', { bubbles: true });
          inputField.dispatchEvent(inputEvent);
          
          // Focus on next field
          if (inputField === healthProblemInput) {
            genderSelect.focus();
          }
        });
        
        resultsContainer.appendChild(resultItem);
      });
      
      // Show results container
      resultsContainer.classList.add('show');
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
      if (!inputField.contains(e.target) && !resultsContainer.contains(e.target)) {
        resultsContainer.classList.remove('show');
      }
    });
    
    // Handle keyboard navigation
    inputField.addEventListener('keydown', function(e) {
      const items = resultsContainer.querySelectorAll('.autocomplete-item');
      
      // If no items or results not showing, return
      if (items.length === 0 || !resultsContainer.classList.contains('show')) {
        return;
      }
      
      // Get currently selected item
      const selectedItem = resultsContainer.querySelector('.selected');
      let selectedIndex = -1;
      
      if (selectedItem) {
        // Find index of selected item
        for (let i = 0; i < items.length; i++) {
          if (items[i] === selectedItem) {
            selectedIndex = i;
            break;
          }
        }
      }
      
      // Arrow down
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        
        // Remove selected class from all items
        items.forEach(item => item.classList.remove('selected'));
        
        // Add selected class to new item
        items[selectedIndex].classList.add('selected');
      }
      
      // Arrow up
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        
        // Remove selected class from all items
        items.forEach(item => item.classList.remove('selected'));
        
        // Add selected class to new item
        items[selectedIndex].classList.add('selected');
      }
      
      // Enter key
      else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        inputField.value = items[selectedIndex].textContent;
        resultsContainer.classList.remove('show');
        
        // Trigger input event to validate
        const inputEvent = new Event('input', { bubbles: true });
        inputField.dispatchEvent(inputEvent);
      }
      
      // Escape key
      else if (e.key === 'Escape') {
        resultsContainer.classList.remove('show');
      }
    });
  }
  
  // Saved Recommendations functionality
  function saveRecommendation(recommendation) {
    if (!recommendation || !recommendation.success) return;
    
    const timestamp = new Date().toISOString();
    const id = 'rec_' + timestamp + '_' + Math.random().toString(36).substr(2, 9);
    
    const savedRec = {
      id: id,
      timestamp: timestamp,
      recommendation: recommendation,
      formData: {
        healthProblem: healthProblemInput.value.trim(),
        gender: genderSelect.value,
        age: ageInput.value,
        existingDrug: existingDrugInput.value.trim()
      }
    };
    
    // Add to saved recommendations
    savedRecommendationsData.push(savedRec);
    
    // Save to localStorage
    localStorage.setItem('mediRecommendSavedRecs', JSON.stringify(savedRecommendationsData));
    
    // Update the UI
    updateSavedRecommendationsList();
    savedRecommendations.classList.add('show');
    
    return savedRec;
  }
  
  function deleteSavedRecommendation(id) {
    // Filter out the deleted recommendation
    savedRecommendationsData = savedRecommendationsData.filter(rec => rec.id !== id);
    
    // Save to localStorage
    localStorage.setItem('mediRecommendSavedRecs', JSON.stringify(savedRecommendationsData));
    
    // Update the UI
    updateSavedRecommendationsList();
    
    // Hide saved recommendations section if empty
    if (savedRecommendationsData.length === 0) {
      savedRecommendations.classList.remove('show');
    }
  }
  
  function loadSavedRecommendations() {
    // Get saved recommendations from localStorage
    const savedRecs = localStorage.getItem('mediRecommendSavedRecs');
    
    return savedRecs ? JSON.parse(savedRecs) : [];
  }
  
  function updateSavedRecommendationsList() {
    savedRecommendationsList.innerHTML = '';
    
    if (savedRecommendationsData.length === 0) {
      savedRecommendationsList.innerHTML = '<p>No saved recommendations yet.</p>';
      return;
    }
    
    // Sort by timestamp (most recent first)
    savedRecommendationsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Create elements for each saved recommendation
    savedRecommendationsData.forEach(savedRec => {
      const rec = savedRec.recommendation;
      const formData = savedRec.formData;
      
      const itemElement = document.createElement('div');
      itemElement.className = 'saved-item';
      
      const dateObj = new Date(savedRec.timestamp);
      const formattedDate = dateObj.toLocaleString();
      
      itemElement.innerHTML = `
        <div class="saved-item-info">
          <span class="saved-item-title">${rec.primaryDrug} for ${rec.healthCondition}</span>
          <span class="saved-item-subtitle">Saved on ${formattedDate}</span>
        </div>
        <div class="saved-item-actions">
          <button class="view-btn" title="View details"><i class="fas fa-eye"></i></button>
          <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      `;
      
      // View recommendation
      itemElement.querySelector('.view-btn').addEventListener('click', () => {
        // Fill form with saved data
        healthProblemInput.value = formData.healthProblem;
        genderSelect.value = formData.gender;
        ageInput.value = formData.age;
        existingDrugInput.value = formData.existingDrug;
        
        // Display the recommendation
        displayDetailedRecommendation(rec);
        
        // Scroll to output
        outputContainer.scrollIntoView({ behavior: 'smooth' });
      });
      
      // Delete recommendation
      itemElement.querySelector('.delete-btn').addEventListener('click', () => {
        deleteSavedRecommendation(savedRec.id);
      });
      
      savedRecommendationsList.appendChild(itemElement);
    });
  }
  
  // Main drug recommendation function
  function getDrugRecommendation(healthProblem, gender, age, existingDrug) {
    // Normalize inputs
    const normalizedCondition = normalizeCondition(healthProblem);
    const ageCategory = getAgeCategory(age);
    
    // Find best matching condition in our database
    let matchedCondition = findBestMatchingCondition(normalizedCondition);
    
    // Get primary drug recommendation
    let primaryDrug = null;
    let drugDetails = {};
    
    if (matchedCondition) {
      primaryDrug = healthConditionsDB[matchedCondition].primaryDrug;
      drugDetails = healthConditionsDB[matchedCondition];
    } else {
      // Fallback for unknown conditions
      return {
        success: false,
        message: "Could not find a specific recommendation for this health condition."
      };
    }
    
    // Check for drug interactions if existing drug is provided
    let safetyInfo = {
      safe: true,
      message: "No known interactions with your current medication.",
      severity: "low",
      alternative: null
    };
    
    if (existingDrug && primaryDrug) {
      // Special check for aspirin with asthma (dangerous combination)
      if (matchedCondition.toLowerCase() === "asthma" && existingDrug.toLowerCase().trim() === "aspirin") {
        safetyInfo.safe = false;
        safetyInfo.message = "WARNING: Aspirin should NOT be used by people with asthma. It can trigger bronchospasm and serious respiratory problems.";
        safetyInfo.severity = "high";
        safetyInfo.alternative = suggestAlternative(matchedCondition, "aspirin");
      } else {
        // Check for interactions between existing drug and recommended drug
        const interaction = checkDrugInteraction(existingDrug, primaryDrug);
        
        if (interaction) {
          safetyInfo.safe = false;
          safetyInfo.message = interaction.description;
          safetyInfo.severity = interaction.severity;
          
          // Suggest alternative medication
          safetyInfo.alternative = suggestAlternative(matchedCondition, existingDrug);
        }
      }
    }
    
    // Check for age-specific considerations
    let ageWarning = null;
    const drugClass = getDrugClass(primaryDrug);
    
    if (drugClass && ageConsiderations[ageCategory] && ageConsiderations[ageCategory][drugClass]) {
      ageWarning = ageConsiderations[ageCategory][drugClass];
    }
    
    // Check for gender-specific considerations
    let genderWarning = null;
    if (drugClass && genderConsiderations[gender] && genderConsiderations[gender][drugClass]) {
      genderWarning = genderConsiderations[gender][drugClass];
    }
    
    // Return complete recommendation
    return {
      success: true,
      healthCondition: matchedCondition,
      primaryDrug: primaryDrug,
      drugDetails: drugDetails,
      safetyInfo: safetyInfo,
      ageWarning: ageWarning,
      genderWarning: genderWarning,
      alternativeDrugs: alternativeMedicationsDB[matchedCondition] || [],
      drugClass: drugClass
    };
  }
  
  // Helper functions for drug recommendation
  function findBestMatchingCondition(condition) {
    // Check for exact match
    for (const cond in healthConditionsDB) {
      if (normalizeCondition(cond) === condition) {
        return cond;
      }
    }
    
    // Check for partial match
    for (const cond in healthConditionsDB) {
      if (condition.includes(normalizeCondition(cond)) || normalizeCondition(cond).includes(condition)) {
        return cond;
      }
    }
    
    return null;
  }
  
  function checkDrugInteraction(drug1, drug2) {
    const normalizedDrug1 = normalizeDrugName(drug1);
    const normalizedDrug2 = normalizeDrugName(drug2);
    
    // Check direct interactions
    for (const interaction in drugInteractionsDB) {
      const [interactionDrug1, interactionDrug2] = interaction.split(',').map(d => normalizeDrugName(d));
      
      if ((normalizedDrug1 === interactionDrug1 && normalizedDrug2 === interactionDrug2) ||
          (normalizedDrug1 === interactionDrug2 && normalizedDrug2 === interactionDrug1)) {
        return drugInteractionsDB[interaction];
      }
    }
    
    // Check drug class interactions
    const drug1Class = getDrugClass(drug1);
    const drug2Class = getDrugClass(drug2);
    
    if (drug1Class && drug2Class) {
      const classInteraction = `${drug1Class},${drug2Class}`;
      const reverseClassInteraction = `${drug2Class},${drug1Class}`;
      
      if (drugInteractionsDB[classInteraction]) {
        return drugInteractionsDB[classInteraction];
      }
      
      if (drugInteractionsDB[reverseClassInteraction]) {
        return drugInteractionsDB[reverseClassInteraction];
      }
    }
    
    return null;
  }
  
  function suggestAlternative(condition, existingDrug) {
    // Get list of alternatives for this condition
    const alternatives = alternativeMedicationsDB[condition] || [];
    
    if (alternatives.length === 0) {
      return null;
    }
    
    // Find the first alternative that doesn't interact with the existing drug
    for (const alt of alternatives) {
      if (!checkDrugInteraction(existingDrug, alt)) {
        return alt;
      }
    }
    
    // If all alternatives have interactions, return the first one with warning
    return alternatives[0];
  }
  
  // Function to display standard recommendation results
  function displayRecommendation(recommendation) {
    outputContainer.innerHTML = '';
    
    if (!recommendation.success) {
      outputContainer.innerHTML = `
        <div class="result-header">
          <i class="fas fa-exclamation-circle"></i>
          <h3>No Recommendation Available</h3>
        </div>
        <p>${recommendation.message}</p>
        <p>Please try a different health condition or consult a healthcare provider.</p>
      `;
      outputContainer.classList.add('show');
      return;
    }
    
    // Create main recommendation HTML
    let html = `
      <div class="result-header">
        <i class="fas fa-pills"></i>
        <h3>Medication Recommendation</h3>
      </div>
      
      <div class="medication-item">
        <h4>${recommendation.primaryDrug}</h4>
        <p><strong>For:</strong> ${recommendation.healthCondition.charAt(0).toUpperCase() + recommendation.healthCondition.slice(1)}</p>
        <p>${recommendation.drugDetails.description}</p>
        <p><strong>Typical dosage:</strong> ${recommendation.drugDetails.dosage}</p>
        <p><strong>Precautions:</strong> ${recommendation.drugDetails.precautions}</p>
    `;
    
    // Add safety information
    if (!recommendation.safetyInfo.safe) {
      let severityClass = 'warning';
      if (recommendation.safetyInfo.severity === 'high') {
        severityClass = 'danger';
      }
      
      html += `
        <div class="safety-info ${severityClass}">
          <p><strong>Warning:</strong> ${recommendation.safetyInfo.message}</p>
          <div class="severity-indicator">
            <span class="severity-dot ${recommendation.safetyInfo.severity}"></span>
            <span>${recommendation.safetyInfo.severity.charAt(0).toUpperCase() + recommendation.safetyInfo.severity.slice(1)} Risk Interaction</span>
          </div>
          ${recommendation.safetyInfo.alternative ? 
            `<p><strong>Suggested Alternative:</strong> ${recommendation.safetyInfo.alternative}</p>` : 
            `<p>No safe alternatives found. Consult your healthcare provider.</p>`
          }
        </div>
      `;
    } else {
      html += `
        <div class="safety-info safe">
          <p><strong>Safety:</strong> ${recommendation.safetyInfo.message}</p>
        </div>
      `;
    }
    
    // Add age and gender warnings if present
    if (recommendation.ageWarning || recommendation.genderWarning) {
      html += `<div class="safety-info warning">`;
      
      if (recommendation.ageWarning) {
        html += `<p><strong>Age Consideration:</strong> ${recommendation.ageWarning}</p>`;
      }
      
      if (recommendation.genderWarning) {
        html += `<p><strong>Gender Consideration:</strong> ${recommendation.genderWarning}</p>`;
      }
      
      html += `</div>`;
    }
    
    html += `</div>`;
    
    // Add "See More Details" button
    html += `
      <div style="text-align: center; margin-top: 15px;">
        <button id="viewDetailedBtn" class="save-btn">
          <i class="fas fa-info-circle"></i> See Detailed Information
        </button>
      </div>
    `;
    
    // Add Save button
    html += `
      <div class="save-recommendation">
        <button id="saveRecommendationBtn" class="save-btn">
          <i class="fas fa-bookmark"></i> Save Recommendation
        </button>
      </div>
    `;
    
    // Add disclaimer
    html += `
      <div class="disclaimer">
        <p><small><em>Disclaimer: This recommendation is for informational purposes only. 
        Always consult with a healthcare professional before starting or changing medication.</em></small></p>
      </div>
    `;
    
    // Display the recommendation
    outputContainer.innerHTML = html;
    outputContainer.classList.add('show');
    
    // Scroll to results
    outputContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Add event listener for save button
    document.getElementById('saveRecommendationBtn').addEventListener('click', function() {
      const savedRec = saveRecommendation(recommendation);
      if (savedRec) {
        alert('Recommendation saved successfully.');
      }
    });
    
    // Add event listener for detailed view button
    document.getElementById('viewDetailedBtn').addEventListener('click', function() {
      displayDetailedRecommendation(recommendation);
    });
  }
  
  // Display the AI-powered recommendation
  function displayAIRecommendation(recommendation) {
    outputContainer.innerHTML = '';
    aiConfidenceVisualization.innerHTML = '';
    aiConfidenceVisualization.classList.remove('show');
    
    if (!recommendation) {
      outputContainer.innerHTML = `
        <div class="message warning">
          <i class="fas fa-exclamation-triangle"></i>
          Unable to generate AI recommendation. Please check your inputs and try again.
        </div>
      `;
      outputContainer.classList.add('show');
      return;
    }
    
    // Create AI recommendation card
    let html = `
      <div class="ai-recommendation-card">
        <div class="ai-recommendation-header">
          <div class="ai-recommendation-title">
            <i class="fas fa-brain"></i> AI Medication Recommendation
          </div>
          <div class="ai-badge">
            <i class="fas fa-robot"></i> AI-Enhanced
          </div>
        </div>
        
        <div class="ai-recommendation-content">
          <p><strong>Health Condition:</strong> ${recommendation.primary_condition.charAt(0).toUpperCase() + recommendation.primary_condition.slice(1)}</p>
          <p><strong>Patient:</strong> ${recommendation.patient.gender}, ${recommendation.patient.age} years old (${recommendation.patient.age_category})</p>
    `;
    
    // Add symptom analysis results if available
    if (recommendation.ai_analysis.symptom_analysis) {
      html += `
        <div class="symptom-analysis-results">
          <p><strong>AI Symptom Analysis:</strong> The following conditions were identified from your symptom description:</p>
          <ul>
      `;
      
      recommendation.ai_analysis.symptom_analysis.forEach(result => {
        const scorePercentage = Math.round(result.match_data.score);
        html += `<li>${result.condition.charAt(0).toUpperCase() + result.condition.slice(1)} (${scorePercentage}% match)</li>`;
      });
      
      html += `
          </ul>
        </div>
      `;
    }
    
    // Add safety warnings if any
    if (recommendation.safety.has_dangerous_interaction) {
      html += `
        <div class="dangerous-interaction">
          <p><i class="fas fa-exclamation-triangle"></i> <strong>WARNING:</strong> ${recommendation.safety.interaction_warning}</p>
          ${recommendation.safety.alternative_medication ? 
            `<p><strong>Suggested Alternative:</strong> ${recommendation.safety.alternative_medication}</p>` : 
            '<p>No safe alternatives found. Consult your healthcare provider.</p>'
          }
        </div>
      `;
    }
    
    // Add top recommendations
    html += `
      <div class="top-recommendations">
        <h4><i class="fas fa-star"></i> Top AI Recommended Medications</h4>
        <p>The AI has analyzed the condition and patient factors to recommend these medications:</p>
        <ol>
    `;
    
    recommendation.recommendations.forEach(rec => {
      html += `
        <li>
          <strong>${rec.medication}</strong> (${Math.round(rec.confidence_score * 100)}% confidence)
          ${rec.is_dangerous_with_existing_medication ? 
            '<span class="warning-badge"><i class="fas fa-exclamation-triangle"></i> Dangerous interaction</span>' : 
            ''
          }
        </li>
      `;
    });
    
    html += `
        </ol>
      </div>
      
      <div class="disclaimer">
        <p><small><em>Disclaimer: This AI recommendation is for informational purposes only. 
        Always consult with a healthcare professional before starting or changing medication.</em></small></p>
      </div>
    `;
    
    // Add save button
    html += `
      <div class="save-recommendation">
        <button id="saveAIRecommendationBtn" class="save-btn">
          <i class="fas fa-bookmark"></i> Save Recommendation
        </button>
      </div>
    `;
    
    html += `</div>`;
    
    // Display the recommendation
    outputContainer.innerHTML = html;
    outputContainer.classList.add('show');
    
    // Create confidence visualization
    createConfidenceVisualization(recommendation.recommendations);
    
    // Scroll to results
    outputContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Add event listener for save button
    document.getElementById('saveAIRecommendationBtn').addEventListener('click', function() {
      const savedRec = saveRecommendation(recommendation);
      if (savedRec) {
        alert('AI Recommendation saved successfully.');
      }
    });
  }
  
  // Create confidence visualization bars
  function createConfidenceVisualization(recommendations) {
    aiConfidenceVisualization.innerHTML = `
      <div class="ai-confidence-header">
        <i class="fas fa-chart-bar"></i>
        <h4>AI Confidence Analysis</h4>
      </div>
      <div class="confidence-bars">
        <p>Comparative analysis of recommended medications based on AI confidence scoring:</p>
        <div id="confidenceBarItems"></div>
      </div>
    `;
    
    const confidenceBarItems = document.getElementById('confidenceBarItems');
    
    recommendations.forEach(rec => {
      const barItem = document.createElement('div');
      barItem.className = 'confidence-bar-item';
      
      const confidencePercentage = Math.round(rec.confidence_score * 100);
      
      barItem.innerHTML = `
        <div class="confidence-bar-header">
          <div class="medication-name">${rec.medication}</div>
          <div class="confidence-score">${confidencePercentage}%</div>
        </div>
        <div class="confidence-bar-container">
          <div class="confidence-bar-fill" style="width: 0%"></div>
        </div>
      `;
      
      confidenceBarItems.appendChild(barItem);
    });
    
    aiConfidenceVisualization.classList.add('show');
    
    // Animate confidence bars
    setTimeout(() => {
      const barFills = document.querySelectorAll('.confidence-bar-fill');
      recommendations.forEach((rec, index) => {
        if (index < barFills.length) {
          barFills[index].style.width = `${Math.round(rec.confidence_score * 100)}%`;
        }
      });
    }, 100);
  }
  
  // Function to display the detailed recommendation view
  function displayDetailedRecommendation(recommendation) {
    if (!recommendation || !recommendation.success) return;
    
    outputContainer.innerHTML = `
      <div class="detailed-view">
        <div class="detailed-header">
          <div class="drug-primary-info">
            <div class="drug-name">${recommendation.primaryDrug}</div>
            <div class="drug-condition">For ${recommendation.healthCondition}</div>
          </div>
          <div class="drug-actions">
            <button id="backToBasicView" class="save-btn">
              <i class="fas fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
        
        <div class="detailed-content">
          <div class="info-section">
            <h4><i class="fas fa-info-circle"></i> Drug Information</h4>
            <p><strong>Drug Class:</strong> ${recommendation.drugClass || "Not specified"}</p>
            <p><strong>Description:</strong> ${recommendation.drugDetails.description}</p>
            <p><strong>Typical Dosage:</strong> ${recommendation.drugDetails.dosage}</p>
            <p><strong>Precautions:</strong> ${recommendation.drugDetails.precautions}</p>
          </div>
          
          <div class="info-section">
            <h4><i class="fas fa-exchange-alt"></i> Alternatives</h4>
            <p>Alternative medications for ${recommendation.healthCondition}:</p>
            <ul class="info-list">
              ${recommendation.alternativeDrugs.map(drug => 
                `<li>${drug}</li>`
              ).join('')}
            </ul>
          </div>
          
          <div class="info-section">
            <h4><i class="fas fa-shield-alt"></i> Safety Information</h4>
            ${!recommendation.safetyInfo.safe ? 
              `<p class="warning"><strong>Warning:</strong> ${recommendation.safetyInfo.message}</p>` : 
              `<p><strong>Safety:</strong> ${recommendation.safetyInfo.message}</p>`
            }
            ${recommendation.ageWarning ? 
              `<p><strong>Age Consideration:</strong> ${recommendation.ageWarning}</p>` : 
              ''
            }
            ${recommendation.genderWarning ? 
              `<p><strong>Gender Consideration:</strong> ${recommendation.genderWarning}</p>` : 
              ''
            }
          </div>
          
          <div class="info-section">
            <h4><i class="fas fa-notes-medical"></i> Clinical Notes</h4>
            <p>Start with the lowest effective dose, especially in elderly patients.</p>
            <p>Monitor regularly for effectiveness and side effects.</p>
            <p>Medication may take several weeks to reach full effect.</p>
          </div>
        </div>
        
        <div class="disclaimer" style="margin-top: 20px;">
          <p><small><em>Disclaimer: This detailed information is for educational purposes only. 
          Always consult with a healthcare professional before starting or changing medication.</em></small></p>
        </div>
      </div>
    `;
    
    // Scroll to the detailed view
    outputContainer.scrollIntoView({ behavior: 'smooth' });
    
    // Add event listener for back button
    document.getElementById('backToBasicView').addEventListener('click', function() {
      displayRecommendation(recommendation);
    });
  }
});
