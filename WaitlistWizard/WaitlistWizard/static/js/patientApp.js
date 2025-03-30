/**
 * MediRecommend - Patient Medication Manager
 * Handles medication tracking and reminder functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize patient interface
  initializeTabSystem();
  initializePatientAutocomplete();
  initializeMedicationTracker();
  initializeReminderSystem();
  setCurrentDate();
});

// Global variables
const MEDICATIONS_STORAGE_KEY = 'patient_medications';
const REMINDERS_STORAGE_KEY = 'medication_reminders';
let medications = [];
let reminders = [];

/**
 * Initialize tab navigation system between doctor and patient views
 */
function initializeTabSystem() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      button.classList.add('active');
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

/**
 * Set the current date as default for date inputs
 */
function setCurrentDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
}

/**
 * Initialize autocomplete functionality for a field
 */
function initializeAutocompleteField(inputField, resultsContainer, dataArray) {
  if (!inputField || !resultsContainer || !dataArray) return;
  
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
  });
}

/**
 * Initialize autocomplete for medication fields in patient section
 */
function initializePatientAutocomplete() {
  // Use the medicationsAutocomplete array for medication name suggestions
  initializeAutocompleteField(
    document.getElementById('medicationName'),
    document.getElementById('patientMedicationResults'),
    medicationsAutocomplete
  );
}

/**
 * Initialize medication tracker functionality
 */
function initializeMedicationTracker() {
  // Load saved medications from local storage
  loadSavedMedications();
  
  // Set up form submission for adding medications
  const medicationForm = document.getElementById('medicationTrackerForm');
  medicationForm.addEventListener('submit', function(e) {
    e.preventDefault();
    addMedication();
  });
  
  // Set up clear form button
  document.getElementById('clearMedicationFormBtn').addEventListener('click', function() {
    medicationForm.reset();
    setCurrentDate();
  });
}

/**
 * Add a new medication to the tracker
 */
function addMedication() {
  const medicationName = document.getElementById('medicationName').value.trim();
  const dosage = document.getElementById('dosage').value.trim();
  const frequency = document.getElementById('frequency').value;
  const startDate = document.getElementById('startDate').value;
  const notes = document.getElementById('notes').value.trim();
  
  if (!medicationName || !dosage || !frequency || !startDate) {
    alert('Please fill in all required fields.');
    return;
  }
  
  // Create new medication object
  const newMedication = {
    id: Date.now(), // Use timestamp as unique ID
    name: medicationName,
    dosage: dosage,
    frequency: frequency,
    startDate: startDate,
    notes: notes,
    dateAdded: new Date().toISOString()
  };
  
  // Add to medications array
  medications.push(newMedication);
  
  // Save to local storage
  saveMedications();
  
  // Update the display
  updateMedicationList();
  
  // Update reminder medication select options
  updateReminderMedicationOptions();
  
  // Reset the form
  document.getElementById('medicationTrackerForm').reset();
  setCurrentDate();
}

/**
 * Save medications to local storage
 */
function saveMedications() {
  localStorage.setItem(MEDICATIONS_STORAGE_KEY, JSON.stringify(medications));
}

/**
 * Load medications from local storage
 */
function loadSavedMedications() {
  const savedMedications = localStorage.getItem(MEDICATIONS_STORAGE_KEY);
  
  if (savedMedications) {
    medications = JSON.parse(savedMedications);
    updateMedicationList();
    updateReminderMedicationOptions();
  }
}

/**
 * Update the medication list display
 */
function updateMedicationList() {
  const medicationList = document.getElementById('medicationList');
  const emptyState = document.getElementById('emptyMedicationState');
  
  // Clear current list
  medicationList.innerHTML = '';
  
  if (medications.length === 0) {
    // Show empty state
    medicationList.appendChild(emptyState);
    return;
  }
  
  // Remove empty state if it exists
  if (emptyState.parentNode === medicationList) {
    medicationList.removeChild(emptyState);
  }
  
  // Add each medication to the list
  medications.forEach(medication => {
    const medicationItem = document.createElement('div');
    medicationItem.className = 'medication-item';
    medicationItem.setAttribute('data-id', medication.id);
    
    medicationItem.innerHTML = `
      <div class="medication-info">
        <div class="medication-name">${medication.name}</div>
        <div class="medication-details">${medication.dosage} - ${getFrequencyText(medication.frequency)}</div>
      </div>
      <div class="medication-actions">
        <button class="notes-btn" title="View Notes" onclick="viewMedicationNotes(${medication.id})">
          <i class="fas fa-sticky-note"></i>
        </button>
        <button class="edit-btn" title="Edit" onclick="editMedication(${medication.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-med-btn" title="Delete" onclick="deleteMedication(${medication.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    medicationList.appendChild(medicationItem);
  });
}

/**
 * Get human-readable frequency text from frequency value
 */
function getFrequencyText(frequency) {
  const frequencies = {
    'once': 'Once daily',
    'twice': 'Twice daily',
    'three': 'Three times daily',
    'four': 'Four times daily',
    'asneeded': 'As needed',
    'other': 'Custom schedule'
  };
  
  return frequencies[frequency] || frequency;
}

/**
 * Delete a medication from the tracker
 */
function deleteMedication(id) {
  if (confirm('Are you sure you want to delete this medication? This will also delete any associated reminders.')) {
    // Remove from medications array
    medications = medications.filter(med => med.id !== id);
    
    // Remove associated reminders
    reminders = reminders.filter(rem => rem.medicationId !== id);
    
    // Save changes
    saveMedications();
    saveReminders();
    
    // Update displays
    updateMedicationList();
    updateRemindersList();
    updateReminderMedicationOptions();
  }
}

/**
 * View medication notes in a modal/alert
 */
function viewMedicationNotes(id) {
  const medication = medications.find(med => med.id === id);
  
  if (medication) {
    const notes = medication.notes || 'No notes available.';
    alert(`Notes for ${medication.name}:\n\n${notes}`);
  }
}

/**
 * Edit a medication (simplified implementation)
 */
function editMedication(id) {
  const medication = medications.find(med => med.id === id);
  
  if (medication) {
    // Populate form with medication data
    document.getElementById('medicationName').value = medication.name;
    document.getElementById('dosage').value = medication.dosage;
    document.getElementById('frequency').value = medication.frequency;
    document.getElementById('startDate').value = medication.startDate;
    document.getElementById('notes').value = medication.notes || '';
    
    // Remove the old medication
    medications = medications.filter(med => med.id !== id);
    
    // Scroll to form
    document.getElementById('medicationTrackerForm').scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Initialize reminder system functionality
 */
function initializeReminderSystem() {
  // Load saved reminders from local storage
  loadSavedReminders();
  
  // Set up form submission for adding reminders
  const reminderForm = document.getElementById('reminderForm');
  reminderForm.addEventListener('submit', function(e) {
    e.preventDefault();
    addReminder();
  });
  
  // Set up clear form button
  document.getElementById('clearReminderFormBtn').addEventListener('click', function() {
    reminderForm.reset();
    document.getElementById('customDays').style.display = 'none';
  });
  
  // Toggle custom days section when custom repeat option is selected
  document.getElementById('reminderRepeat').addEventListener('change', function() {
    const customDaysSection = document.getElementById('customDays');
    customDaysSection.style.display = this.value === 'custom' ? 'block' : 'none';
  });
  
  // Initial population of medication select
  updateReminderMedicationOptions();
}

/**
 * Update the medication select options in the reminder form
 */
function updateReminderMedicationOptions() {
  const select = document.getElementById('reminderMedication');
  
  // Clear current options (except the first default option)
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Add option for each medication
  medications.forEach(med => {
    const option = document.createElement('option');
    option.value = med.id;
    option.textContent = `${med.name} (${med.dosage})`;
    select.appendChild(option);
  });
}

/**
 * Add a new medication reminder
 */
function addReminder() {
  const medicationId = document.getElementById('reminderMedication').value;
  const reminderTime = document.getElementById('reminderTime').value;
  const repeatPattern = document.getElementById('reminderRepeat').value;
  
  if (!medicationId || !reminderTime) {
    alert('Please select a medication and time for the reminder.');
    return;
  }
  
  // Get the selected days for custom repeat pattern
  let selectedDays = [];
  if (repeatPattern === 'custom') {
    const dayCheckboxes = document.querySelectorAll('.day-item input[type="checkbox"]:checked');
    if (dayCheckboxes.length === 0) {
      alert('Please select at least one day for the reminder.');
      return;
    }
    
    dayCheckboxes.forEach(checkbox => {
      selectedDays.push(checkbox.value);
    });
  }
  
  // Create new reminder object
  const newReminder = {
    id: Date.now(), // Use timestamp as unique ID
    medicationId: parseInt(medicationId),
    time: reminderTime,
    repeatPattern: repeatPattern,
    selectedDays: selectedDays,
    isActive: true,
    dateAdded: new Date().toISOString()
  };
  
  // Add to reminders array
  reminders.push(newReminder);
  
  // Save to local storage
  saveReminders();
  
  // Update the display
  updateRemindersList();
  
  // Reset the form
  document.getElementById('reminderForm').reset();
  document.getElementById('customDays').style.display = 'none';
}

/**
 * Save reminders to local storage
 */
function saveReminders() {
  localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
}

/**
 * Load reminders from local storage
 */
function loadSavedReminders() {
  const savedReminders = localStorage.getItem(REMINDERS_STORAGE_KEY);
  
  if (savedReminders) {
    reminders = JSON.parse(savedReminders);
    updateRemindersList();
  }
}

/**
 * Update the reminders list display
 */
function updateRemindersList() {
  const remindersList = document.getElementById('remindersList');
  const emptyState = document.getElementById('emptyRemindersState');
  
  // Clear current list
  remindersList.innerHTML = '';
  
  if (reminders.length === 0) {
    // Show empty state
    remindersList.appendChild(emptyState);
    return;
  }
  
  // Remove empty state if it exists
  if (emptyState.parentNode === remindersList) {
    remindersList.removeChild(emptyState);
  }
  
  // Add each reminder to the list
  reminders.forEach(reminder => {
    const medication = medications.find(med => med.id === reminder.medicationId);
    
    if (!medication) {
      // Skip if medication doesn't exist anymore
      return;
    }
    
    const reminderItem = document.createElement('div');
    reminderItem.className = 'reminder-item';
    reminderItem.setAttribute('data-id', reminder.id);
    
    const repeatText = getRepeatText(reminder);
    
    reminderItem.innerHTML = `
      <div class="reminder-info">
        <div class="reminder-title">${medication.name} (${medication.dosage})</div>
        <div class="reminder-time">${formatTime(reminder.time)}</div>
        <div class="reminder-details">${repeatText}</div>
      </div>
      <div class="reminder-actions">
        <button class="edit-btn" title="Edit" onclick="editReminder(${reminder.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="delete-reminder-btn" title="Delete" onclick="deleteReminder(${reminder.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    remindersList.appendChild(reminderItem);
  });
}

/**
 * Get human-readable repeat pattern text
 */
function getRepeatText(reminder) {
  switch (reminder.repeatPattern) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      return 'Weekdays (Mon-Fri)';
    case 'weekends':
      return 'Weekends (Sat-Sun)';
    case 'custom':
      return 'Custom: ' + reminder.selectedDays.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
    default:
      return reminder.repeatPattern;
  }
}

/**
 * Format time for display (12-hour format with AM/PM)
 */
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(':');
  let hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; // Convert 0 to 12
  return `${hour}:${minutes} ${ampm}`;
}

/**
 * Delete a reminder
 */
function deleteReminder(id) {
  if (confirm('Are you sure you want to delete this reminder?')) {
    // Remove from reminders array
    reminders = reminders.filter(rem => rem.id !== id);
    
    // Save changes
    saveReminders();
    
    // Update display
    updateRemindersList();
  }
}

/**
 * Edit a reminder (simplified implementation)
 */
function editReminder(id) {
  const reminder = reminders.find(rem => rem.id === id);
  
  if (reminder) {
    // Populate form with reminder data
    document.getElementById('reminderMedication').value = reminder.medicationId;
    document.getElementById('reminderTime').value = reminder.time;
    document.getElementById('reminderRepeat').value = reminder.repeatPattern;
    
    // Handle custom days
    if (reminder.repeatPattern === 'custom') {
      document.getElementById('customDays').style.display = 'block';
      
      // Uncheck all checkboxes first
      document.querySelectorAll('.day-item input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
      });
      
      // Check the selected days
      reminder.selectedDays.forEach(day => {
        const checkbox = document.getElementById(`day-${day}`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    } else {
      document.getElementById('customDays').style.display = 'none';
    }
    
    // Remove the old reminder
    reminders = reminders.filter(rem => rem.id !== id);
    
    // Scroll to form
    document.getElementById('reminderForm').scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Check if a reminder should be active on the current day
 * This would be used for a real reminder system implementation
 */
function shouldReminderBeActiveToday(reminder) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  switch (reminder.repeatPattern) {
    case 'daily':
      return true;
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'weekends':
      return dayOfWeek === 0 || dayOfWeek === 6;
    case 'custom':
      const dayMap = {
        'sun': 0,
        'mon': 1,
        'tue': 2,
        'wed': 3,
        'thu': 4,
        'fri': 5,
        'sat': 6
      };
      return reminder.selectedDays.some(day => dayMap[day] === dayOfWeek);
    default:
      return false;
  }
}