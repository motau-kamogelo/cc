// GA4 helper. Do not send marks, names, student numbers, or other identifiers.
function trackEvent(eventName) {
  if (typeof gtag === "function") gtag("event", eventName);
}
trackEvent("calculator_loaded");

const moduleType = document.getElementById("moduleType");
const ice = document.getElementById("ice");
const f1 = document.getElementById("f1");
const f2 = document.getElementById("f2");
const target = document.getElementById("target");
const f1WeightInput = document.getElementById("f1Weight");
const f2WeightInput = document.getElementById("f2Weight");
const summativeWeightInput = document.getElementById("summativeWeight");

const current = document.getElementById("current");
const iceContribution = document.getElementById("iceContribution");
const f1Contribution = document.getElementById("f1Contribution");
const f2Contribution = document.getElementById("f2Contribution");
const maximum = document.getElementById("maximum");
const required = document.getElementById("required");
const message = document.getElementById("message");
const error = document.getElementById("error");
const weightingError = document.getElementById("weightingError");
const weightingTotal = document.getElementById("weightingTotal");
const customWeightings = document.getElementById("customWeightings");
const currentHeading = document.getElementById("currentHeading");
const requiredHeading = document.getElementById("requiredHeading");
const summaryF1 = document.getElementById("summaryF1");
const summaryF2 = document.getElementById("summaryF2");
const summarySummative = document.getElementById("summarySummative");
const summaryNote = document.getElementById("summaryNote");

function getMark(input) {
  if (input.value.trim() === "") return 0;
  const value = Number(input.value);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getWeight(input) {
  if (input.value.trim() === "") return NaN;
  const value = Number(input.value);
  return Number.isFinite(value) && value >= 0 && value <= 90 ? value : NaN;
}

function getWeights() {
  if (moduleType.value === "poe") {
    return { f1: 25, f2: 30, summative: 35, valid: true };
  }
  const w1 = getWeight(f1WeightInput);
  const w2 = getWeight(f2WeightInput);
  const ws = getWeight(summativeWeightInput);
  const validValues = [w1, w2, ws].every(Number.isFinite);
  const total = validValues ? w1 + w2 + ws : NaN;
  return { f1: w1, f2: w2, summative: ws, valid: validValues && Math.abs(total - 90) < 0.001, total };
}

function updateModuleMode() {
  const isPoe = moduleType.value === "poe";
  customWeightings.hidden = isPoe;
  currentHeading.textContent = isPoe ? "3. Current CASS" : "4. Current module mark";
  requiredHeading.textContent = isPoe ? "4. What Summative POE mark do I need?" : "5. What Summative mark do I need?";
  summaryNote.textContent = isPoe
    ? "Standard POE weighting is applied: Formative 1 = 25%, Formative 2 = 30%, Summative = 35%."
    : "Custom non-POE weighting is applied. ICE remains worth up to 10%, and the other three weightings must total 90%.";
  trackEvent("module_type_selected");
  calculate();
}

function validateMarks() {
  const invalidF1 = f1.value !== "" && (!Number.isFinite(Number(f1.value)) || Number(f1.value) < 0 || Number(f1.value) > 100);
  const invalidF2 = f2.value !== "" && (!Number.isFinite(Number(f2.value)) || Number(f2.value) < 0 || Number(f2.value) > 100);
  const invalidTarget = target.value !== "" && (!Number.isFinite(Number(target.value)) || Number(target.value) < 0 || Number(target.value) > 100);
  if (invalidF1 || invalidF2 || invalidTarget) {
    error.textContent = "Marks must be numbers between 0 and 100.";
    return false;
  }
  error.textContent = "";
  return true;
}

function validateWeights(weights) {
  if (moduleType.value === "poe") {
    weightingError.textContent = "";
    weightingTotal.textContent = "Standard POE formative and Summative weightings total 90%, plus up to 10% for ICE.";
    return true;
  }
  if (![weights.f1, weights.f2, weights.summative].every(Number.isFinite)) {
    weightingError.textContent = "Enter a valid weighting between 0% and 90% for each assessment.";
    weightingTotal.textContent = "Current weighting total: — / 90% required";
    return false;
  }
  weightingTotal.textContent = `Formative 1 + Formative 2 + Summative = ${weights.total.toFixed(1)}% (90% required)`;
  if (!weights.valid) {
    weightingError.textContent = "These three weightings must add up to exactly 90%, because ICE contributes up to 10%.";
    return false;
  }
  weightingError.textContent = "";
  return true;
}

function calculate() {
  const weights = getWeights();
  const marksValid = validateMarks();
  const weightsValid = validateWeights(weights);
  summaryF1.textContent = Number.isFinite(weights.f1) ? `${weights.f1}%` : "—";
  summaryF2.textContent = Number.isFinite(weights.f2) ? `${weights.f2}%` : "—";
  summarySummative.textContent = Number.isFinite(weights.summative) ? `${weights.summative}%` : "—";

  if (!marksValid || !weightsValid) {
    current.textContent = "—";
    iceContribution.textContent = "—";
    f1Contribution.textContent = "—";
    f2Contribution.textContent = "—";
    maximum.textContent = "—";
    required.textContent = "—";
    message.textContent = !weightsValid ? "Fix the assessment weightings before calculating your result." : "Correct the invalid mark values before calculating your result.";
    return;
  }

  const iceWeighted = Number(ice.value) * 2.5;
  const formative1Weighted = getMark(f1) * weights.f1 / 100;
  const formative2Weighted = getMark(f2) * weights.f2 / 100;
  const earned = iceWeighted + formative1Weighted + formative2Weighted;
  const maximumFinal = earned + weights.summative;

  iceContribution.textContent = `${iceWeighted.toFixed(2)}%`;
  f1Contribution.textContent = `${formative1Weighted.toFixed(2)}%`;
  f2Contribution.textContent = `${formative2Weighted.toFixed(2)}%`;
  current.textContent = `${earned.toFixed(2)}%`;
  maximum.textContent = `${maximumFinal.toFixed(2)}%`;
  calculateRequiredSummative(earned, weights.summative);
}

function calculateRequiredSummative(earned, summativeWeight) {
  if (target.value.trim() === "") {
    required.textContent = "—";
    message.textContent = "Enter your marks and desired final mark.";
    return;
  }

  const desired = getMark(target);
  if (desired <= earned) {
    required.textContent = "0.00%";
    message.textContent = "You have already earned enough weighted marks to reach this target.";
    return;
  }
  if (summativeWeight <= 0) {
    required.textContent = "Not available";
    message.textContent = "The Summative weighting must be greater than 0% to calculate a required mark.";
    return;
  }

  const requiredMark = (desired - earned) / (summativeWeight / 100);
  if (requiredMark <= 100) {
    required.textContent = `${requiredMark.toFixed(2)}%`;
    message.textContent = `You need at least ${requiredMark.toFixed(2)}% in the Summative assessment to achieve ${desired.toFixed(2)}% overall.`;
  } else {
    required.textContent = ">100%";
    message.textContent = "This target cannot be achieved with the current marks, even with 100% in the Summative assessment.";
  }
}

moduleType.addEventListener("change", updateModuleMode);
[ice, f1, f2, target, f1WeightInput, f2WeightInput, summativeWeightInput].forEach(element => {
  element.addEventListener("input", calculate);
  element.addEventListener("change", calculate);
});
[ice, f1, f2].forEach(element => element.addEventListener("change", () => trackEvent("cass_calculated")));
target.addEventListener("change", () => {
  if (target.value !== "" && target.validity.valid) trackEvent("required_summative_calculated");
});
document.querySelectorAll("[data-target]").forEach(button => {
  button.addEventListener("click", () => {
    target.value = button.dataset.target;
    trackEvent("target_selected");
    calculate();
    target.focus();
  });
});

updateModuleMode();
