
const supabaseUrl = "https://gtkkiyrblzoteqqlwtmv.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0a2tpeXJibHpvdGVxcWx3dG12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODk0MTksImV4cCI6MjA4NjU2NTQxOX0.l1enNy07eylD_C0n_WgQEiWQbwxCHP6T9tP6oh0lwHg";

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function saveUser() {

    const name = document.getElementById("name").value;
    const age = document.getElementById("age").value;
    const height = document.getElementById("height").value;
    const weight = document.getElementById("weight").value;
    const goal = document.getElementById("goal").value;

    const { data, error } = await supabaseClient
        .from("users")
        .insert([
            { name, age, height, weight, goal }
        ]);

    if(error){
        alert("Error saving user!");
        console.log(error);
    } else {
        alert("User Saved Successfully!");
    }
}

// Initialize
let currentStep = 1;
let userData = {};

// Retrieve stored data on page load
window.addEventListener('DOMContentLoaded', function() {
    const stored = localStorage.getItem('dietPlanData');
    if (stored) {
        userData = JSON.parse(stored);
        showResults();
    }
});

function nextStep(step) {
    if (validateStep(step)) {
        saveStepData(step);
        currentStep++;
        updateUI();
    }
}

function prevStep(step) {
    currentStep--;
    updateUI();
}

function validateStep(step) {
    const form = document.getElementById(`form${step}`);
    if (!form.checkValidity()) {
        alert('Please fill all required fields correctly');
        return false;
    }
    return true;
}

function saveStepData(step) {
    if (step === 1) {
        userData.name = document.getElementById('name').value;
        userData.email = document.getElementById('email').value;
        userData.age = parseInt(document.getElementById('age').value);
        userData.height = parseInt(document.getElementById('height').value);
        userData.weight = parseInt(document.getElementById('weight').value);
        userData.activity = document.getElementById('activity').value;
    } else if (step === 2) {
        userData.dietReason = document.getElementById('diet-reason').value;
        userData.dietType = document.getElementById('diet-type').value;
        userData.restrictions = Array.from(document.querySelectorAll('input[name="restrictions"]:checked')).map(x => x.value);
        userData.cravings = document.getElementById('cravings').value;
        userData.healthConditions = document.getElementById('health-conditions').value;
    } else if (step === 3) {
        userData.period1 = document.getElementById('period1').value;
        userData.period2 = document.getElementById('period2').value;
        userData.period3 = document.getElementById('period3').value;
        userData.cycleLength = parseInt(document.getElementById('cycle-length').value);
        userData.periodDuration = parseInt(document.getElementById('period-duration').value);
        userData.symptoms = Array.from(document.querySelectorAll('input[name="symptoms"]:checked')).map(x => x.value);
    } else if (step === 4) {
        userData.bpSystolic = parseInt(document.getElementById('blood-pressure-systolic').value) || 0;
        userData.bpDiastolic = parseInt(document.getElementById('blood-pressure-diastolic').value) || 0;
        userData.hemoglobin = parseFloat(document.getElementById('hemoglobin').value) || 0;
        userData.bloodSugar = parseInt(document.getElementById('blood-sugar').value) || 0;
        userData.cholesterol = parseInt(document.getElementById('cholesterol').value) || 0;
        userData.medicalHistory = Array.from(document.querySelectorAll('input[name="medicalHistory"]:checked')).map(x => x.value);
        userData.fitnessGoals = Array.from(document.querySelectorAll('input[name="fitnessGoals"]:checked')).map(x => x.value);
        userData.exerciseFrequency = parseInt(document.getElementById('exercise-frequency').value) || 0;
        userData.sleepHours = parseFloat(document.getElementById('sleep-hours').value) || 0;
    }
}

function updateUI() {
    document.querySelectorAll('.form-section').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === currentStep);
    });

    document.querySelectorAll('.step').forEach((el, index) => {
        const stepNum = index + 1;
        el.classList.toggle('active', stepNum === currentStep);
        el.classList.toggle('completed', stepNum < currentStep);
    });
}

function submitForms() {
    if (validateStep(3)) {
        saveStepData(3);
        localStorage.setItem('dietPlanData', JSON.stringify(userData));
        showResults();
    }
}

function calculateCycleInfo() {
    const date1 = new Date(userData.period1);
    const date2 = new Date(userData.period2);
    const date3 = new Date(userData.period3);

    const gap1 = Math.round((date1 - date2) / (1000 * 60 * 60 * 24));
    const gap2 = Math.round((date2 - date3) / (1000 * 60 * 60 * 24));

    const averageCycle = Math.round((gap1 + gap2) / 2);
    userData.calculatedCycleLength = averageCycle;

    const nextPeriodDate = new Date(date1);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycle);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let cyclePhase = 'follicular'; // default
    const daysIntoCurrentCycle = Math.round((today - date1) / (1000 * 60 * 60 * 24));

    if (daysIntoCurrentCycle < userData.periodDuration) {
        cyclePhase = 'menstrual';
    } else if (daysIntoCurrentCycle < 14) {
        cyclePhase = 'follicular';
    } else if (daysIntoCurrentCycle < 21) {
        cyclePhase = 'ovulation';
    } else {
        cyclePhase = 'luteal';
    }

    return {
        nextPeriod: nextPeriodDate,
        cycleLength: averageCycle,
        phase: cyclePhase,
        daysIntoCurrentCycle: daysIntoCurrentCycle
    };
}

function getDietRecommendations(phase) {
    const dietRecommendations = {
        menstrual: {
            title: '🔴 MENSTRUAL PHASE - Period Days',
            subtitle: 'Days 1-5 of your cycle',
            meals: [
                'Breakfast: Oatmeal with berries, honey, and almonds (iron + carbs)',
                'Snack: Red dates or raisins with green tea',
                'Lunch: Red meat or spinach with sweet potato and beetroot',
                'Snack: Pomegranate or watermelon',
                'Dinner: Salmon with broccoli and brown rice (Omega-3 + iron)',
            ],
            nutrients: [
                'Iron (combats fatigue)',
                'Vitamin B12 (energy)',
                'Magnesium (cramps & mood)',
                'Omega-3 (inflammation)',
                'Calcium (bone health)'
            ],
            avoidance: [
                'Caffeine (may increase cramps)',
                'High sugar foods',
                'Greasy foods',
                'Alcohol'
            ],
            hydration: '3.5-4 liters water daily (blood loss)',
            tip: 'Eat warm foods, increase red meat/spinach for iron replenishment'
        },
        follicular: {
            title: '🟡 FOLLICULAR PHASE - Energy Building',
            subtitle: 'Days 6-13 of your cycle',
            meals: [
                'Breakfast: Greek yogurt with granola and mixed berries',
                'Snack: Apple with almond butter',
                'Lunch: Quinoa salad with chickpeas, cucumber, and lemon dressing',
                'Snack: Nuts and seeds mix',
                'Dinner: Grilled chicken with asparagus and wild rice',
            ],
            nutrients: [
                'Protein (muscle building)',
                'Complex carbs (energy)',
                'Folate (cell growth)',
                'Antioxidants (skin glow)',
                'B vitamins (metabolism)'
            ],
            avoidance: [
                'Skip restrictive eating',
                'Avoid missing meals'
            ],
            hydration: '2-2.5 liters water daily',
            tip: 'This is the best time to start new healthy habits! Metabolism is rising, energy is increasing!'
        },
        ovulation: {
            title: '🟣 OVULATION PHASE - Peak Energy',
            subtitle: 'Days 14-20 of your cycle',
            meals: [
                'Breakfast: Smoothie with spinach, banana, protein powder, and almond milk',
                'Snack: Hard-boiled eggs (2-3)',
                'Lunch: Tuna salad with mixed greens and olive oil dressing',
                'Snack: Greek yogurt with honey and walnuts',
                'Dinner: Lean beef steak with sweet potato and broccoli',
            ],
            nutrients: [
                'High protein (peak metabolic rate)',
                'Lean meats (sustain energy)',
                'Healthy fats (brain function)',
                'Vegetables (detox)',
                'Complex carbs (fuel'
            ],
            avoidance: [
                'Refined sugars',
                'Heavy fried foods'
            ],
            hydration: '2.5-3 liters water daily',
            tip: 'Your metabolism is at its peak! This is ideal time for heavy workouts and adding more protein!'
        },
        luteal: {
            title: '🟠 LUTEAL PHASE - Cozy Nourishment',
            subtitle: 'Days 21-28 of your cycle',
            meals: [
                'Breakfast: Warm oatmeal with nuts, seeds, and cinnamon',
                'Snack: Dark chocolate (70% cacao) with almonds',
                'Lunch: Slow-cooked stew with lean meat, vegetables, and whole grains',
                'Snack: Whole grain bread with peanut butter',
                'Dinner: Baked salmon with roasted vegetables and sweet potato',
            ],
            nutrients: [
                'Magnesium (mood & sleep)',
                'Serotonin-boosting foods',
                'Complex carbs (stabilize mood)',
                'Omega-3 (brain health)',
                'Iron (prepare for period)'
            ],
            avoidance: [
                'Restrict caffeine (affects sleep)',
                'Limit high-sodium foods (bloating)',
                'Avoid skipping meals (mood swings)'
            ],
            hydration: '2-2.5 liters water daily',
            tip: 'Progesterone is high, metabolism slows. Focus on comfort foods, quality sleep, and self-care'
        }
    };

    return dietRecommendations[phase] || dietRecommendations.follicular;
}

function getMoodCravingAdvice(symptoms) {
    const advice = {
        cramps: '🌡️ Include magnesium-rich foods (dark chocolate, nuts, seeds) and increase calcium intake',
        bloating: '💧 Reduce sodium, increase potassium (bananas, coconut water), stay hydrated',
        'mood swings': '😊 Eat serotonin-boosting foods (dark chocolate, bananas, walnuts, turkey)',
        fatigue: '⚡ Prioritize iron-rich foods, B vitamins, and adequate protein'
    };

    let result = 'Based on your symptoms:\n\n';
    if (symptoms && symptoms.length > 0) {
        symptoms.forEach(symptom => {
            result += (advice[symptom] || '') + '\n';
        });
    }
    return result;
}

function calculateBMI(height, weight) {
    // height in cm, weight in kg
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(1));
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'Underweight', status: 'bmi-underweight', label: 'Underweight' };
    if (bmi < 25) return { category: 'Normal Weight', status: 'bmi-normal', label: 'Normal' };
    if (bmi < 30) return { category: 'Overweight', status: 'bmi-overweight', label: 'Overweight' };
    return { category: 'Obese', status: 'bmi-obese', label: 'Obese' };
}

function getBloodPressureStatus(systolic, diastolic) {
    if (systolic === 0 || diastolic === 0) return { status: 'unknown', message: 'Not provided' };
    if (systolic < 120 && diastolic < 80) return { status: 'normal', message: 'Normal' };
    if (systolic < 130 && diastolic < 80) return { status: 'elevated', message: 'Elevated' };
    if (systolic < 140 || diastolic < 90) return { status: 'stage1-hypertension', message: 'Stage 1 Hypertension' };
    return { status: 'stage2-hypertension', message: 'Stage 2 Hypertension' };
}

function getHemoglobinStatus(hemoglobin) {
    if (hemoglobin === 0) return { status: 'unknown', message: 'Not provided' };
    if (hemoglobin < 12) return { status: 'low', message: 'Low - Possible Anemia', recommendation: 'Increase iron intake' };
    if (hemoglobin <= 16) return { status: 'normal', message: 'Normal', recommendation: 'Maintain current diet' };
    return { status: 'high', message: 'High', recommendation: 'Consult doctor' };
}

function getBloodSugarStatus(bloodSugar) {
    if (bloodSugar === 0) return { status: 'unknown', message: 'Not provided' };
    if (bloodSugar < 100) return { status: 'normal', message: 'Normal Fasting' };
    if (bloodSugar < 126) return { status: 'prediabetes', message: 'Prediabetic Range' };
    return { status: 'diabetes', message: 'Diabetic Range' };
}

function getCholesterolStatus(cholesterol) {
    if (cholesterol === 0) return { status: 'unknown', message: 'Not provided' };
    if (cholesterol < 200) return { status: 'desirable', message: 'Desirable' };
    if (cholesterol < 240) return { status: 'borderline', message: 'Borderline High' };
    return { status: 'high', message: 'High' };
}

function getDailyCalorieNeeds(weight, height, age, activity) {
    // Harris-Benedict equation for females (BMR)
    const bmr = 655 + (9.6 * weight) + (1.8 * height) - (4.7 * age);
    
    const activityMultipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    };

    const multiplier = activityMultipliers[activity] || 1.2;
    return Math.round(bmr * multiplier);
}

function generateHealthRecommendations(bmi, bp, hemoglobin, bloodSugar, cholesterol, medicalHistory, sleepHours, exerciseFrequency) {
    let recommendations = [];

    // BMI recommendations
    if (bmi < 18.5) {
        recommendations.push('💪 Focus on nutrient-dense foods to gain healthy weight gradually. Increase calories by 300-500/day.');
    } else if (bmi >= 25 && bmi < 30) {
        recommendations.push('🎯 Gradual weight loss through balanced diet and regular exercise. Aim for 0.5-1kg per week.');
    } else if (bmi >= 30) {
        recommendations.push('⚠️ Consider consulting a nutritionist for a structured weight loss plan. Focus on sustainable changes.');
    }

    // Blood pressure
    if (bp.status === 'elevated' || bp.status === 'stage1-hypertension') {
        recommendations.push('🩺 Reduce sodium intake to <2,300mg/day. Include potassium-rich foods (bananas, spinach, sweet potato).');
    } else if (bp.status === 'stage2-hypertension') {
        recommendations.push('🚨 Consult your doctor. Reduce sodium drastically and increase aerobic exercise.');
    }

    // Hemoglobin
    if (hemoglobin < 12) {
        recommendations.push('🥗 Increase iron intake: Red meat, spinach, lentils, fortified cereals. Pair with vitamin C for better absorption.');
    }

    // Blood sugar
    if (bloodSugar.status === 'prediabetes') {
        recommendations.push('⚡ Reduce refined sugars and simple carbs. Focus on fiber-rich foods and regular exercise.');
    } else if (bloodSugar.status === 'diabetes') {
        recommendations.push('🔔 Work with endocrinologist on meal planning. Monitor carb intake carefully.');
    }

    // Cholesterol
    if (cholesterol.status === 'borderline' || cholesterol.status === 'high') {
        recommendations.push('❤️ Reduce saturated fats, increase omega-3s (fish, flaxseeds). Include fiber from whole grains.');
    }

    // Medical conditions - specific
    if (medicalHistory && medicalHistory.length > 0) {
        if (medicalHistory.includes('PCOS')) {
            recommendations.push('🌸 PCOS: Low glycemic index diet helps. Include anti-inflammatory foods. Manage intra-abdominal fat.');
        }
        if (medicalHistory.includes('thyroid')) {
            recommendations.push('🦋 Thyroid: Ensure adequate iodine and selenium. Avoid excessive cruciferous vegetables when hypothyroid.');
        }
        if (medicalHistory.includes('anemia')) {
            recommendations.push('🩸 Anemia: Iron supplementation may be needed. Consult doctor before starting iron supplements.');
        }
        if (medicalHistory.includes('IBS')) {
            recommendations.push('🌿 IBS: Identify trigger foods. Increase soluble fiber gradually. Stay hydrated.');
        }
    }

    // Sleep
    if (sleepHours < 6) {
        recommendations.push('😴 Poor sleep affects hormones and hunger. Aim for 7-9 hours nightly for better metabolism.');
    } else if (sleepHours > 10) {
        recommendations.push('⏰ Excessive sleep may indicate health issues. Consult doctor if unusual.');
    }

    // Exercise
    if (exerciseFrequency < 3) {
        recommendations.push('🏃 Aim for 150 minutes moderate-intensity exercise weekly. Start gradually if inactive.');
    } else if (exerciseFrequency >= 5) {
        recommendations.push('⭐ Excellent activity level! Ensure adequate protein and recovery for performance.');
    }

    return recommendations.length > 0 ? recommendations : ['Your current health metrics look good! Continue maintaining your healthy lifestyle.'];
}

function showResults() {
    const cycleInfo = calculateCycleInfo();
    const phase = cycleInfo.phase;
    const recommendations = getDietRecommendations(phase);

    // User greeting
    document.getElementById('userGreeting').innerHTML = `
        Welcome back, <strong>${userData.name}</strong>! 👋
        <br>Your personalized diet plan has been generated based on your cycle phase today.
    `;

    // Calculate Health Metrics
    const bmi = calculateBMI(userData.height, userData.weight);
    const bmiCat = getBMICategory(bmi);
    const bpStatus = getBloodPressureStatus(userData.bpSystolic, userData.bpDiastolic);
    const hemoglobinStatus = getHemoglobinStatus(userData.hemoglobin);
    const bloodSugarStatus = getBloodSugarStatus(userData.bloodSugar);
    const cholesterolStatus = getCholesterolStatus(userData.cholesterol);
    const dailyCalories = getDailyCalorieNeeds(userData.weight, userData.height, userData.age, userData.activity);
    const healthRecs = generateHealthRecommendations(bmi, bpStatus, userData.hemoglobin, bloodSugarStatus, cholesterolStatus, userData.medicalHistory, userData.sleepHours, userData.exerciseFrequency);

    // Health Stats Dashboard
    let healthStatsHTML = '';
    
    // BMI Card
    healthStatsHTML += `
        <div class="stat-card stat-card.${bmiCat.status}">
            <div class="stat-value">${bmi}</div>
            <div class="stat-label">BMI</div>
            <div class="stat-status status-${bmiCat.status === 'bmi-normal' ? 'normal' : (bmiCat.status === 'bmi-underweight' ? 'warning' : 'alert')}">${bmiCat.category}</div>
        </div>
    `;

    // Daily Calories
    healthStatsHTML += `
        <div class="stat-card">
            <div class="stat-value">${dailyCalories}</div>
            <div class="stat-label">Daily Calories</div>
            <div class="stat-status status-normal">Estimated</div>
        </div>
    `;

    // Blood Pressure
    if (userData.bpSystolic > 0) {
        const bpColor = bpStatus.status === 'normal' ? 'normal' : (bpStatus.status === 'elevated' ? 'warning' : 'alert');
        healthStatsHTML += `
            <div class="stat-card">
                <div class="stat-value">${userData.bpSystolic}/${userData.bpDiastolic}</div>
                <div class="stat-label">Blood Pressure</div>
                <div class="stat-status status-${bpColor}">${bpStatus.message}</div>
            </div>
        `;
    }

    // Hemoglobin
    if (userData.hemoglobin > 0) {
        const hemoColor = hemoglobinStatus.status === 'normal' ? 'normal' : 'alert';
        healthStatsHTML += `
            <div class="stat-card">
                <div class="stat-value">${userData.hemoglobin}</div>
                <div class="stat-label">Hemoglobin (g/dL)</div>
                <div class="stat-status status-${hemoColor}">${hemoglobinStatus.message}</div>
            </div>
        `;
    }

    // Blood Sugar
    if (userData.bloodSugar > 0) {
        const glucoseColor = bloodSugarStatus.status === 'normal' ? 'normal' : (bloodSugarStatus.status === 'prediabetes' ? 'warning' : 'alert');
        healthStatsHTML += `
            <div class="stat-card">
                <div class="stat-value">${userData.bloodSugar}</div>
                <div class="stat-label">Fasting Glucose (mg/dL)</div>
                <div class="stat-status status-${glucoseColor}">${bloodSugarStatus.message}</div>
            </div>
        `;
    }

    // Cholesterol
    if (userData.cholesterol > 0) {
        const cholColor = cholesterolStatus.status === 'desirable' ? 'normal' : (cholesterolStatus.status === 'borderline' ? 'warning' : 'alert');
        healthStatsHTML += `
            <div class="stat-card">
                <div class="stat-value">${userData.cholesterol}</div>
                <div class="stat-label">Cholesterol (mg/dL)</div>
                <div class="stat-status status-${cholColor}">${cholesterolStatus.message}</div>
            </div>
        `;
    }

    document.getElementById('healthStats').innerHTML = healthStatsHTML;

    // BMI Chart
    let bmiChartHTML = `
        <h4>Body Mass Index (BMI) Ranges</h4>
        <div class="bmi-range">
            <div class="bmi-range-segment bmi-underweight" style="width: 15%;">Underweight</div>
            <div class="bmi-range-segment bmi-normal" style="width: 25%;">Normal</div>
            <div class="bmi-range-segment bmi-overweight" style="width: 25%;">Overweight</div>
            <div class="bmi-range-segment bmi-obese" style="width: 35%;">Obese</div>
        </div>
        <p style="color: #666; font-size: 0.9rem; margin-top: 10px;">Your BMI: <strong>${bmi}</strong> (${bmiCat.category})</p>
        <p style="color: #666; font-size: 0.85rem; margin-top: 10px;">BMI Ranges: Underweight (<18.5) | Normal (18.5-24.9) | Overweight (25-29.9) | Obese (30+)</p>
    `;
    document.getElementById('bmiChartSection').innerHTML = bmiChartHTML;

    // Health Recommendations
    let recsHTML = '<div class="health-recommendations"><h4>💡 Personalized Health Recommendations</h4><ul>';
    healthRecs.forEach(rec => {
        recsHTML += `<li>${rec}</li>`;
    });
    recsHTML += '</ul></div>';
    document.getElementById('healthRecommendations').innerHTML = recsHTML;

    // Cycle info
    const nextPeriodDate = cycleInfo.nextPeriod.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    document.getElementById('cycleInfo').innerHTML = `
        <p><strong>🔄 Menstrual Cycle Length:</strong> ${cycleInfo.cycleLength} days</p>
        <p><strong>📅 Next Period Expected:</strong> ${nextPeriodDate}</p>
        <p><strong>📊 Current Phase:</strong> ${recommendations.title}</p>
        <p><strong>📍 Days into Current Cycle:</strong> ${cycleInfo.daysIntoCurrentCycle}</p>
    `;

    // Phase info
    const phaseDescriptions = {
        menstrual: 'Your body is actively menstruating. Focus on iron replenishment and comfort.',
        follicular: 'Estrogen is rising! This is a great time to start new activities and push yourself.',
        ovulation: 'You are at your peak! Confidence, energy, and metabolism are at their highest.',
        luteal: 'Prepare your body for the next cycle. Focus on rest and self-care.'
    };

    document.getElementById('phaseInfo').innerHTML = `
        <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0284c7;">
            <p style="color: #0c4a6e; margin: 0;"><strong>📍 Current Cycle Phase: ${recommendations.subtitle}</strong></p>
            <p style="color: #0c4a6e; margin: 5px 0 0 0;">${phaseDescriptions[phase]}</p>
        </div>
    `;

    // Normal day diet
    let normalDayHTML = `
        <h3>${recommendations.title}</h3>
        <p style="color: #666; margin-bottom: 15px;">${recommendations.subtitle}</p>
    `;

    // Add meal recommendations
    normalDayHTML += '<div class="meal-section"><h4>🍽️ Recommended Meals</h4><div class="meal-list">';
    recommendations.meals.forEach(meal => {
        normalDayHTML += `<p>${meal}</p>`;
    });
    normalDayHTML += '</div></div>';

    // Add nutrients section
    normalDayHTML += '<div class="meal-section"><h4>🥗 Key Nutrients to Focus On</h4><div class="nutrition-highlights">';
    recommendations.nutrients.forEach(nutrient => {
        normalDayHTML += `<div class="nutrition-card macro"><p>${nutrient}</p></div>`;
    });
    normalDayHTML += '</div></div>';

    // Add do's and don'ts
    normalDayHTML += '<div class="meal-section"><h4>⚠️ Foods to Avoid</h4><div class="meal-list">';
    recommendations.avoidance.forEach(item => {
        normalDayHTML += `<p>${item}</p>`;
    });
    normalDayHTML += '</div></div>';

    // Add hydration and tip
    normalDayHTML += `
        <div class="meal-section">
            <h4>💧 Hydration</h4>
            <p style="color: #555; padding-left: 15px;">${recommendations.hydration}</p>
        </div>
        <div class="mood-section">
            <strong>💡 Pro Tip:</strong>
            <p>${recommendations.tip}</p>
        </div>
    `;

    document.getElementById('normalDayCard').innerHTML = normalDayHTML;

    // Period day advice
    let periodDayHTML = `
        <h3>🩸 During Your Period - Special Food Recommendations</h3>
        <p style="color: #666; margin-bottom: 15px;">When you're actively menstruating, follow these guidelines</p>
    `;

    const moodAdvice = getMoodCravingAdvice(userData.symptoms);
    periodDayHTML += `
        <div class="mood-section">
            <strong>Based on Your Symptoms:</strong>
            ${moodAdvice.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
        </div>
    `;

    if (userData.cravings) {
        periodDayHTML += `
            <div class="meal-section">
                <h4>🍫 Honoring Your Cravings</h4>
                <p style="color: #555; padding-left: 15px;">Your preference: ${userData.cravings}</p>
                <p style="color: #555; padding-left: 15px; font-size: 0.9rem;">Pro tip: Satisfy cravings with healthier versions. Want chocolate? Try high-quality dark chocolate (70%+). Want salty? Choose homemade popcorn instead of chips.</p>
            </div>
        `;
    }

    periodDayHTML += `
        <div class="meal-section">
            <h4>💪 Period-Specific Nutrition</h4>
            <div class="nutrition-highlights">
                <div class="nutrition-card micro"><h5>Iron</h5><p>Red meat, spinach, legumes</p></div>
                <div class="nutrition-card micro"><h5>Vitamin B12</h5><p>Meat, eggs, fortified foods</p></div>
                <div class="nutrition-card micro"><h5>Magnesium</h5><p>Dark chocolate, nuts, seeds</p></div>
                <div class="nutrition-card micro"><h5>Calcium</h5><p>Dairy, leafy greens, tofu</p></div>
                <div class="nutrition-card micro"><h5>Omega-3</h5><p>Fish, flaxseeds, walnuts</p></div>
                <div class="nutrition-card micro"><h5>Zinc</h5><p>Shellfish, beef, pumpkin seeds</p></div>
            </div>
        </div>
    `;

    document.getElementById('periodDayCard').innerHTML = periodDayHTML;

    // Hide forms and show results
    currentStep = 5;
    updateUI();
    document.getElementById('results').classList.add('active');
    document.querySelectorAll('.form-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active');
        if (index < 4) el.classList.add('completed');
    });
}

function resetApp() {
    if (confirm('Are you sure you want to start over? This will clear all your data.')) {
        localStorage.removeItem('dietPlanData');
        userData = {};
        currentStep = 1;
        document.getElementById('form1').reset();
        document.getElementById('form2').reset();
        document.getElementById('form3').reset();
        document.getElementById('form4').reset();
        document.getElementById('results').classList.remove('active');
        updateUI();
    }
}
