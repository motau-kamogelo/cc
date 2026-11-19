// Anonymous usage events only. Do not send marks, names, student numbers or identifiers.
function trackEvent(eventName) {
  if (typeof gtag === "function") gtag("event", eventName);
}
trackEvent("calculator_loaded");

const panels = [...document.querySelectorAll(".step-panel")];
const stepTitles = ["ICE Tasks", "Set formatives weighting", "Formative assessments", "Desired final results", "CASS results"];
const stepLabel = document.getElementById("stepLabel");
const stepTitle = document.getElementById("stepTitle");
const progressBar = document.getElementById("progressBar");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const navigationError = document.getElementById("navigationError");

const ice = document.getElementById("ice");
const f1Weight = document.getElementById("f1Weight");
const f2Weight = document.getElementById("f2Weight");
const f1 = document.getElementById("f1");
const f2 = document.getElementById("f2");
const target = document.getElementById("target");
let currentStep = 0;

const $ = id => document.getElementById(id);

function numericValue(input) {
  if (input.value.trim() === "") return NaN;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : NaN;
}
function markIsValid(input, optional = false) {
  if (optional && input.value.trim() === "") return true;
  const value = numericValue(input);
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
function getWeights() {
  const w1 = numericValue(f1Weight);
  const w2 = numericValue(f2Weight);
  const validRange = [w1, w2].every(v => Number.isFinite(v) && v >= 0 && v <= 55);
  const total = validRange ? w1 + w2 : NaN;
  return { w1, w2, total, valid: validRange && Math.abs(total - 55) < 0.001 };
}
function validateWeightings(showMessage = true) {
  const weights = getWeights();
  $("weightingTotal").textContent = Number.isFinite(weights.total)
    ? `Formative weighting total: ${weights.total.toFixed(1)}% / 55%`
    : "Formative weighting total: — / 55%";
  const error = !Number.isFinite(weights.w1) || !Number.isFinite(weights.w2)
    ? "Enter valid weightings between 0% and 55%."
    : !weights.valid ? "Formative 1 and Formative 2 weightings must add up to exactly 55%." : "";
  $("weightingError").textContent = showMessage ? error : "";
  return weights.valid;
}
function validateFormativeMarks(showMessage = true) {
  const valid = markIsValid(f1) && markIsValid(f2);
  $("markError").textContent = showMessage && !valid ? "Enter both formative marks as numbers between 0 and 100." : "";
  return valid;
}
function validateTarget(showMessage = true) {
  const valid = markIsValid(target);
  $("targetError").textContent = showMessage && !valid ? "Enter a desired final mark between 0 and 100." : "";
  return valid;
}
function validateStep(step) {
  if (step === 1) return validateWeightings(true);
  if (step === 2) return validateFormativeMarks(true);
  if (step === 3) return validateTarget(true);
  return true;
}
function showStep(step) {
  currentStep = Math.max(0, Math.min(step, panels.length - 1));
  panels.forEach((panel, index) => { panel.hidden = index !== currentStep; });
  stepLabel.textContent = `Screen ${currentStep + 1} of ${panels.length}`;
  stepTitle.textContent = stepTitles[currentStep];
  progressBar.style.width = `${((currentStep + 1) / panels.length) * 100}%`;
  backButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === panels.length - 1 ? "Start again" : currentStep === panels.length - 2 ? "View results" : "Next";
  navigationError.textContent = "";
  if (currentStep === 4) calculateResults();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function calculateResults() {
  const weights = getWeights();
  if (!weights.valid || !validateFormativeMarks(false) || !validateTarget(false)) return;

  const iceContribution = Number(ice.value) * 2.5;
  const f1Contribution = Number(f1.value) * weights.w1 / 100;
  const f2Contribution = Number(f2.value) * weights.w2 / 100;
  const earned = iceContribution + f1Contribution + f2Contribution;
  const maximumFinal = earned + 35;

  $("iceContribution").textContent = `${iceContribution.toFixed(2)}%`;
  $("f1Contribution").textContent = `${f1Contribution.toFixed(2)}%`;
  $("f2Contribution").textContent = `${f2Contribution.toFixed(2)}%`;
  $("current").textContent = `${earned.toFixed(2)}%`;
  $("maximum").textContent = `${maximumFinal.toFixed(2)}%`;
  $("summaryF1").textContent = `${weights.w1}%`;
  $("summaryF2").textContent = `${weights.w2}%`;

  const desired = Number(target.value);
  const result = $("required");
  const message = $("message");
  if (desired <= earned) {
    result.textContent = "0.00%";
    message.textContent = "You have already earned enough weighted marks to reach this target.";
  } else {
    const needed = (desired - earned) / 0.35;
    if (needed <= 100) {
      result.textContent = `${needed.toFixed(2)}%`;
      message.textContent = `You need at least ${needed.toFixed(2)}% in the Summative assessment to achieve ${desired.toFixed(2)}% overall.`;
    } else {
      result.textContent = ">100%";
      message.textContent = "This target cannot be achieved with your current marks, even with 100% in the Summative assessment.";
    }
  }
}

nextButton.addEventListener("click", () => {
  if (currentStep === panels.length - 1) {
    document.querySelectorAll("input[type=number]").forEach(input => { input.value = input.id.endsWith("Weight") ? (input.id === "f1Weight" ? "25" : "30") : ""; });
    ice.value = "0";
    showStep(0);
    return;
  }
  if (!validateStep(currentStep)) return;
  if (currentStep === 3) trackEvent("results_viewed");
  showStep(currentStep + 1);
});
backButton.addEventListener("click", () => showStep(currentStep - 1));
[f1Weight, f2Weight].forEach(input => input.addEventListener("input", () => validateWeightings(true)));
[f1, f2].forEach(input => input.addEventListener("input", () => validateFormativeMarks(true)));
target.addEventListener("input", () => validateTarget(true));
document.querySelectorAll("[data-target]").forEach(button => button.addEventListener("click", () => {
  target.value = button.dataset.target;
  validateTarget(true);
  trackEvent("target_selected");
}));
ice.addEventListener("change", () => trackEvent("ice_tasks_updated"));
showStep(0);
