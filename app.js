/* =====================================================================
   Cervical Health Symptom Checker
   ---------------------------------------------------------------------
   HOW TO EDIT THE CLINICAL CONTENT
   - Section 1 (SYMPTOMS) lists every symptom, its wording, and its
     urgency level: "urgent", "priority" or "routine".
   - Section 2 (RISK_FACTORS) lists background / screening questions.
   - Section 3 (OUTCOMES) holds the advice text for each triage level.
   You can change wording or add/remove items there without touching
   the rest of the code. Please have the content reviewed by your
   clinical team before real-world use.
   ===================================================================== */


/* ---------- 1. SYMPTOMS ---------- */
// level: "urgent"   = seek care today / emergency
//        "priority" = see a provider within 1-2 weeks
//        "routine"  = book a routine appointment
const SYMPTOMS = [
  // --- Urgent (red flags) ---
  { id: "heavy_bleeding", level: "urgent", group: "Warning signs",
    label: "Very heavy vaginal bleeding",
    help: "Soaking a pad or tampon every hour for 2 hours or more, or passing large clots." },
  { id: "faint", level: "urgent", group: "Warning signs",
    label: "Dizziness, fainting, or racing heart together with vaginal bleeding" },
  { id: "severe_pain", level: "urgent", group: "Warning signs",
    label: "Severe pelvic or lower belly pain that is not settling" },
  { id: "cant_urinate", level: "urgent", group: "Warning signs",
    label: "Unable to pass urine, or very little urine",
    help: "Or severe pain in the side/back with fever." },
  { id: "leg_swelling", level: "urgent", group: "Warning signs",
    label: "New painful swelling of one leg, or sudden breathlessness / chest pain" },

  // --- Priority (see a provider within 1-2 weeks) ---
  { id: "postcoital", level: "priority", group: "Bleeding and discharge",
    label: "Bleeding after sex",
    help: "Bleeding that happens during or after sexual intercourse." },
  { id: "intermenstrual", level: "priority", group: "Bleeding and discharge",
    label: "Bleeding between periods, or periods that are much heavier or longer than usual" },
  { id: "postmenopausal", level: "priority", group: "Bleeding and discharge",
    label: "Any vaginal bleeding or spotting after menopause",
    help: "Even a small amount, if your periods stopped 12 months or more ago.",
    onlyIf: (a) => a.menopause !== "no" },
  { id: "discharge", level: "priority", group: "Bleeding and discharge",
    label: "Unusual vaginal discharge that is watery, bloody, brown, or foul-smelling",
    help: "Lasting more than a few days." },
  { id: "urine_blood", level: "priority", group: "Other symptoms",
    label: "Blood in your urine or stool" },
  { id: "weight_loss", level: "priority", group: "Other symptoms",
    label: "Unexplained weight loss or loss of appetite" },
  { id: "back_leg_pain", level: "priority", group: "Other symptoms",
    label: "Ongoing back pain, leg pain, or swelling in the legs",
    help: "Not explained by an injury or exercise." },

  // --- Routine ---
  { id: "pelvic_pain", level: "routine", group: "Other symptoms",
    label: "Mild or on-and-off pelvic pain" },
  { id: "pain_sex", level: "routine", group: "Other symptoms",
    label: "Pain during sex" },
  { id: "fatigue", level: "routine", group: "Other symptoms",
    label: "Unusual tiredness that does not go away" },
  { id: "urinary", level: "routine", group: "Other symptoms",
    label: "Needing to pass urine more often, or discomfort when passing urine" }
];

// How long has the symptom been present? (value = number of days, used for rules)
const DURATIONS = [
  { value: 3,   label: "Less than 1 week" },
  { value: 14,  label: "1 to 4 weeks" },
  { value: 60,  label: "1 to 3 months" },
  { value: 120, label: "More than 3 months" }
];


/* ---------- 2. RISK FACTORS & SCREENING ---------- */
const RISK_FACTORS = [
  { id: "never_screened", label: "I have never had cervical screening (Pap / HPV test), or not in the last 5 years" },
  { id: "abnormal_result", label: "I have been told I had an abnormal screening result or HPV, and did not have follow-up" },
  { id: "no_vaccine", label: "I have not had the HPV vaccine" },
  { id: "smoker", label: "I smoke or used to smoke regularly" },
  { id: "immune", label: "I am living with HIV or have a weakened immune system (e.g. on long-term steroids or transplant medicines)" },
  { id: "contraceptive", label: "I have used the contraceptive pill for 5 years or more" },
  { id: "pregnancies", label: "I have had 3 or more full-term pregnancies" },
  { id: "family", label: "A close family member has had cervical cancer" }
];


/* ---------- 3. OUTCOMES (advice shown to the patient) ---------- */
const OUTCOMES = {
  urgent: {
    title: "Get medical help today",
    summary: "Some of the symptoms you reported can be serious and need to be checked urgently.",
    actions: [
      "Go to the nearest emergency department or urgent care today, or call your local emergency number.",
      "Do not wait for a routine appointment.",
      "Take this summary with you, or show it on your phone."
    ]
  },
  priority: {
    title: "See a healthcare provider within 1 to 2 weeks",
    summary: "Your symptoms should be assessed soon. Many causes are not cancer (such as infection or hormonal changes), but they need to be checked.",
    actions: [
      "Book an appointment with your doctor, gynaecologist, or women's health clinic and say you have symptoms that need to be seen soon.",
      "Share the summary below so your provider has the full picture.",
      "If your symptoms get worse, or heavy bleeding or severe pain starts, seek care the same day."
    ]
  },
  routine: {
    title: "Book a routine appointment",
    summary: "Your symptoms are less likely to be urgent, but they are worth discussing with a healthcare provider.",
    actions: [
      "Book an appointment in the next few weeks.",
      "Share the summary below with your provider.",
      "If new symptoms appear (especially bleeding), re-do this check and see a provider sooner."
    ]
  },
  low: {
    title: "No concerning symptoms reported",
    summary: "Based on your answers, you did not report symptoms that need prompt review.",
    actions: [
      "Keep up with regular cervical screening as recommended for your age.",
      "If you notice any new bleeding, discharge, or pain, come back and re-do this check.",
      "Speak to a provider about the HPV vaccine if you have not had it."
    ]
  }
};

// Order of seriousness, used to compare levels
const LEVEL_RANK = { low: 0, routine: 1, priority: 2, urgent: 3 };


/* =====================================================================
   APP CODE (you normally do not need to change anything below)
   ===================================================================== */

const TOTAL_STEPS = 4;
let currentStep = 1;
let lastReport = ""; // plain-text version of the report for copy/download

// Shortcuts to page elements
const $ = (id) => document.getElementById(id);
const steps = document.querySelectorAll(".step");
const backBtn = $("backBtn");
const nextBtn = $("nextBtn");


/* ---------- Build the checklists ---------- */
function buildSymptomList() {
  const answers = getAboutYou();
  const container = $("symptomList");
  container.innerHTML = "";

  // Remember what was already ticked if the user comes back
  const previous = getSelectedSymptoms();

  let lastGroup = "";
  SYMPTOMS.forEach((s) => {
    if (s.onlyIf && !s.onlyIf(answers)) return; // hide if not relevant

    if (s.group !== lastGroup) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = s.group;
      container.appendChild(title);
      lastGroup = s.group;
    }

    const item = document.createElement("div");
    item.className = "item";

    const label = document.createElement("label");
    label.className = "check";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = "sym_" + s.id;

    const text = document.createElement("span");
    text.textContent = s.label;
    if (s.help) {
      const help = document.createElement("span");
      help.className = "help";
      help.textContent = s.help;
      text.appendChild(help);
    }
    label.appendChild(box);
    label.appendChild(text);
    item.appendChild(label);

    // Duration drop-down, shown only when the box is ticked
    const dur = document.createElement("div");
    dur.className = "duration";
    dur.hidden = true;
    const durLabel = document.createElement("label");
    durLabel.setAttribute("for", "dur_" + s.id);
    durLabel.textContent = "How long has this been happening?";
    const sel = document.createElement("select");
    sel.id = "dur_" + s.id;
    DURATIONS.forEach((d) => {
      const o = document.createElement("option");
      o.value = d.value;
      o.textContent = d.label;
      sel.appendChild(o);
    });
    dur.appendChild(durLabel);
    dur.appendChild(sel);
    item.appendChild(dur);

    box.addEventListener("change", () => {
      dur.hidden = !box.checked;
      item.classList.toggle("checked", box.checked);
    });

    // Restore earlier choice
    if (previous[s.id] !== undefined) {
      box.checked = true;
      sel.value = previous[s.id];
      dur.hidden = false;
      item.classList.add("checked");
    }

    container.appendChild(item);
  });
}

function buildRiskList() {
  const container = $("riskList");
  RISK_FACTORS.forEach((r) => {
    const item = document.createElement("div");
    item.className = "item";
    const label = document.createElement("label");
    label.className = "check";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.id = "risk_" + r.id;
    const text = document.createElement("span");
    text.textContent = r.label;
    label.appendChild(box);
    label.appendChild(text);
    item.appendChild(label);
    box.addEventListener("change", () => item.classList.toggle("checked", box.checked));
    container.appendChild(item);
  });
}


/* ---------- Read answers from the page ---------- */
function getAboutYou() {
  return {
    name: $("name").value.trim(),
    age: parseInt($("age").value, 10),
    menopause: $("menopause").value,
    pregnant: $("pregnant").value
  };
}

// Returns { symptomId: durationInDays } for all ticked symptoms
function getSelectedSymptoms() {
  const result = {};
  SYMPTOMS.forEach((s) => {
    const box = $("sym_" + s.id);
    if (box && box.checked) result[s.id] = parseInt($("dur_" + s.id).value, 10);
  });
  return result;
}

function getSelectedRisks() {
  return RISK_FACTORS.filter((r) => $("risk_" + r.id).checked);
}


/* ---------- Triage logic ---------- */
function calculateTriage(about, selected, risks) {
  let level = "low";
  const reasons = [];

  // 1. Highest level among the symptoms chosen
  SYMPTOMS.forEach((s) => {
    if (selected[s.id] === undefined) return;
    if (LEVEL_RANK[s.level] > LEVEL_RANK[level]) level = s.level;
  });

  // 2. A routine symptom lasting more than 4 weeks moves up to "priority"
  if (level === "routine") {
    const longLasting = SYMPTOMS.some((s) => selected[s.id] !== undefined && selected[s.id] >= 60);
    if (longLasting) {
      level = "priority";
      reasons.push("A symptom has lasted more than 4 weeks.");
    }
  }

  // 3. Three or more routine symptoms together also move up to "priority"
  const routineCount = SYMPTOMS.filter((s) => s.level === "routine" && selected[s.id] !== undefined).length;
  if (level === "routine" && routineCount >= 3) {
    level = "priority";
    reasons.push("Several symptoms are present together.");
  }

  // 4. A priority symptom with higher risk (immune problem, abnormal result
  //    not followed up, or never screened) is kept as priority and flagged
  const highRisk = risks.some((r) => ["immune", "abnormal_result", "never_screened"].includes(r.id));
  if (level === "priority" && highRisk) {
    reasons.push("Your background (screening / immune status) increases the importance of being seen promptly.");
  }

  // 5. No symptoms, but overdue for screening
  if (level === "low" && risks.some((r) => r.id === "never_screened" || r.id === "abnormal_result")) {
    level = "routine";
    reasons.push("You are overdue for cervical screening or follow-up.");
  }

  // 6. Pregnancy with bleeding is always checked promptly
  if (about.pregnant === "yes" && level !== "low" && level !== "urgent") {
    const bleeding = ["postcoital", "intermenstrual", "discharge"].some((id) => selected[id] !== undefined);
    if (bleeding) {
      level = "urgent";
      reasons.push("Vaginal bleeding during pregnancy should be assessed the same day.");
    }
  }

  return { level, reasons };
}


/* ---------- Results page ---------- */
function showResults() {
  const about = getAboutYou();
  const selected = getSelectedSymptoms();
  const risks = getSelectedRisks();
  const notes = $("notes").value.trim();
  const { level, reasons } = calculateTriage(about, selected, risks);
  const outcome = OUTCOMES[level];

  const symptomLines = SYMPTOMS
    .filter((s) => selected[s.id] !== undefined)
    .map((s) => {
      const d = DURATIONS.find((x) => x.value === selected[s.id]);
      return `${s.label} (${d ? d.label.toLowerCase() : "duration not given"})`;
    });

  // Build the plain-text report
  const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const menoText = { yes: "Yes", no: "No", na: "Not sure / not applicable" }[about.menopause];
  const pregText = { yes: "Yes", no: "No", unsure: "Not sure" }[about.pregnant];
  const lines = [];
  lines.push("CERVICAL SYMPTOM CHECK - PATIENT SUMMARY");
  lines.push("Date: " + today);
  if (about.name) lines.push("Name: " + about.name);
  lines.push("Age: " + about.age);
  lines.push("Post-menopausal: " + menoText + " | Pregnant: " + pregText);
  lines.push("");
  lines.push("SUGGESTED URGENCY: " + outcome.title.toUpperCase());
  if (reasons.length) reasons.forEach((r) => lines.push("  - " + r));
  lines.push("");
  lines.push("REPORTED SYMPTOMS:");
  if (symptomLines.length) symptomLines.forEach((l) => lines.push("  - " + l));
  else lines.push("  - None reported");
  lines.push("");
  lines.push("BACKGROUND / SCREENING:");
  if (risks.length) risks.forEach((r) => lines.push("  - " + r.label));
  else lines.push("  - Nothing reported");
  if (notes) {
    lines.push("");
    lines.push("PATIENT NOTES: " + notes);
  }
  lines.push("");
  lines.push("Generated by a self-reported symptom checker. This is not a diagnosis; clinical assessment is required.");
  lastReport = lines.join("\n");

  // Draw the results on screen
  const box = $("result");
  box.innerHTML = "";
  box.className = "result";

  const banner = document.createElement("div");
  banner.className = "banner " + level;
  const h = document.createElement("h2");
  h.textContent = outcome.title;
  const p = document.createElement("p");
  p.textContent = outcome.summary;
  banner.appendChild(h);
  banner.appendChild(p);
  box.appendChild(banner);

  if (reasons.length) {
    box.appendChild(makeHeading("Why this advice"));
    box.appendChild(makeList(reasons));
  }

  box.appendChild(makeHeading("What to do next"));
  box.appendChild(makeList(outcome.actions));

  box.appendChild(makeHeading("Summary to share with your provider"));
  const report = document.createElement("div");
  report.className = "report-box";
  report.textContent = lastReport;
  box.appendChild(report);

  const actions = document.createElement("div");
  actions.className = "actions";
  actions.appendChild(makeButton("Print / Save as PDF", () => window.print()));
  actions.appendChild(makeButton("Copy text", copyReport));
  actions.appendChild(makeButton("Download .txt", downloadReport));
  actions.appendChild(makeButton("Start over", () => location.reload()));
  const copied = document.createElement("span");
  copied.className = "copied";
  copied.id = "copiedMsg";
  actions.appendChild(copied);
  box.appendChild(actions);
}

function makeHeading(text) {
  const h = document.createElement("h3");
  h.textContent = text;
  return h;
}
function makeList(items) {
  const ul = document.createElement("ul");
  items.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    ul.appendChild(li);
  });
  return ul;
}
function makeButton(text, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn secondary";
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

function copyReport() {
  const msg = $("copiedMsg");
  const done = () => { msg.textContent = "Copied!"; setTimeout(() => (msg.textContent = ""), 2500); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(lastReport).then(done, () => { msg.textContent = "Could not copy - please select the text manually."; });
  } else {
    msg.textContent = "Copy not supported - please select the text manually.";
  }
}

function downloadReport() {
  const blob = new Blob([lastReport], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "symptom-summary.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


/* ---------- Step navigation ---------- */
function showStep(n) {
  currentStep = n;
  steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
  $("progressBar").style.width = (n / TOTAL_STEPS) * 100 + "%";
  $("stepLabel").textContent = n < TOTAL_STEPS ? `Step ${n} of ${TOTAL_STEPS - 1}` : "Your results";

  backBtn.hidden = n === 1 || n === TOTAL_STEPS;
  nextBtn.hidden = n === TOTAL_STEPS;
  nextBtn.textContent = n === TOTAL_STEPS - 1 ? "See my results" : "Next";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nextBtn.addEventListener("click", () => {
  if (currentStep === 1) {
    const age = parseInt($("age").value, 10);
    const bad = isNaN(age) || age < 10 || age > 110;
    $("ageError").hidden = !bad;
    if (bad) { $("age").focus(); return; }
    buildSymptomList(); // rebuild, since menopause answer may change the list
  }
  if (currentStep === TOTAL_STEPS - 1) showResults();
  showStep(currentStep + 1);
});

backBtn.addEventListener("click", () => showStep(currentStep - 1));

// Prevent Enter key from submitting/reloading the page
$("checkerForm").addEventListener("submit", (e) => e.preventDefault());


/* ---------- Start ---------- */
buildRiskList();
showStep(1);
