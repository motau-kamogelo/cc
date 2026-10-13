// Google Analytics 4 helper. Events deliberately contain no marks or identifiers.
function trackEvent(eventName) {
  if (typeof gtag === "function") {
    gtag("event", eventName);
  }
}

// Count a calculator visit (GA4 must be configured in index.html).
trackEvent("calculator_loaded");

const ice = document.getElementById("ice");
const f1 = document.getElementById("f1");
const f2 = document.getElementById("f2");
const target = document.getElementById("target");

const current = document.getElementById("current");

const iceContribution =
  document.getElementById("iceContribution");

const f1Contribution =
  document.getElementById("f1Contribution");

const f2Contribution =
  document.getElementById("f2Contribution");

const maximum =
  document.getElementById("maximum");

const required =
  document.getElementById("required");

const message =
  document.getElementById("message");

const error =
  document.getElementById("error");


function getMark(input) {

  if (input.value === "") {
    return 0;
  }

  const value = Number(input.value);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}


function calculate() {

  // ICE
  const iceWeighted =
    Number(ice.value) * 2.5;


  // Formative marks
  const formative1 =
    getMark(f1);

  const formative2 =
    getMark(f2);


  // Weighted contributions
  const f1Weighted =
    formative1 * 0.25;

  const f2Weighted =
    formative2 * 0.30;


  // Current CASS before Summative
  const earned =
    iceWeighted +
    f1Weighted +
    f2Weighted;


  // Maximum final CASS if Summative = 100%
  const maximumFinal =
    earned + 35;


  // Display
  iceContribution.textContent =
    iceWeighted.toFixed(2) + "%";

  f1Contribution.textContent =
    f1Weighted.toFixed(2) + "%";

  f2Contribution.textContent =
    f2Weighted.toFixed(2) + "%";

  current.textContent =
    earned.toFixed(2) + "%";

  maximum.textContent =
    maximumFinal.toFixed(2) + "%";


  validate();

  calculateRequiredSummative(earned);
}


function validate() {

  const invalidF1 =
    f1.value !== "" &&
    (Number(f1.value) < 0 ||
     Number(f1.value) > 100);

  const invalidF2 =
    f2.value !== "" &&
    (Number(f2.value) < 0 ||
     Number(f2.value) > 100);


  if (invalidF1 || invalidF2) {

    error.textContent =
      "Marks must be between 0 and 100.";

  } else {

    error.textContent = "";

  }
}


function calculateRequiredSummative(earned) {

  if (target.value === "") {

    required.textContent = "—";

    message.textContent =
      "Enter your marks and desired final CASS.";

    return;
  }


  const desired =
    getMark(target);


  /*
    Final CASS formula:

    Final CASS =
    Current earned contribution +
    (Summative × 35%)

    Therefore:

    Required Summative =
    (Desired CASS - Current contribution) / 0.35
  */

  const requiredMark =
    (desired - earned) / 0.35;


  if (desired <= earned) {

    required.textContent =
      "0.00%";

    message.textContent =
      "You have already earned enough weighted marks to reach this target.";

    return;
  }


  if (requiredMark <= 100) {

    required.textContent =
      requiredMark.toFixed(2) + "%";

    message.textContent =
      "You need at least " +
      requiredMark.toFixed(2) +
      "% in the Summative POE to achieve " +
      desired.toFixed(2) +
      "% overall.";

    return;
  }


  required.textContent =
    ">100%";

  message.textContent =
    "This target cannot be achieved with the current marks, even with 100% in the Summative POE.";

}


// Update the display as students enter information.
[ice, f1, f2, target].forEach(element => {
  element.addEventListener("input", calculate);
  element.addEventListener("change", calculate);
});

// Track a completed field change, without sending any entered marks.
[ice, f1, f2].forEach(element => {
  element.addEventListener("change", () => {
    trackEvent("cass_calculated");
  });
});

target.addEventListener("change", () => {
  if (target.value !== "" && !target.validity.rangeUnderflow && !target.validity.rangeOverflow) {
    trackEvent("required_summative_calculated");
  }
});


// Quick target buttons
document
  .querySelectorAll("[data-target]")
  .forEach(button => {

    button.addEventListener("click", () => {

      target.value =
        button.dataset.target;

      // Record that a quick target was selected, without its percentage value.
      trackEvent("target_selected");

      calculate();

      target.focus();

    });

  });


// Initial calculation
calculate();
