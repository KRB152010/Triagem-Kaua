class TriageController {
  constructor(state, dom, callbacks, priorityLabels) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
    this.priorityLabels = priorityLabels;
  }

  init() {
    this.dom.triagePatient.addEventListener("change", () => this.selectPatient());
    ["bloodPressure", "temperature", "oxygen", "heartRate"].forEach((id) => {
      document.getElementById(id).addEventListener("input", () => this.renderVitalPreview());
    });
    this.dom.suggestRisk.addEventListener("click", () => this.suggestRisk());
    this.dom.triageForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearTriageForm.addEventListener("click", () => this.reset());
  }

  selectPatient() {
    this.state.selectedPatientId = this.dom.triagePatient.value;
    this.renderPatientSummary();
  }

  parseBloodPressure(value) {
    if (!value) {
      return { systolic: NaN, diastolic: NaN };
    }

    const normalized = value.replace(",", ".").trim();
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*[/\-]\s*(\d+(?:\.\d+)?)/);

    if (!match) {
      return { systolic: NaN, diastolic: NaN };
    }

    return {
      systolic: Number(match[1]),
      diastolic: Number(match[2])
    };
  }

  normalizeClassification(value) {
    return value || "branco";
  }

  calculateSuggestion() {
    const pressure = this.parseBloodPressure(document.getElementById("bloodPressure").value);
    const temperature = Number(document.getElementById("temperature").value);
    const oxygen = Number(document.getElementById("oxygen").value);
    const symptomsText = document.getElementById("symptoms").value.toLowerCase();
    const heartRate = Number(document.getElementById("heartRate").value);

    if (oxygen < 90 || pressure.systolic >= 180 || temperature >= 38.5 || symptomsText.includes("dor no peito") || symptomsText.includes("convuls") || symptomsText.includes("desmaio")) {
      return "vermelho";
    }

    if (oxygen < 94 || pressure.systolic >= 160 || temperature >= 37.8 || heartRate > 120 || symptomsText.includes("falta de ar") || symptomsText.includes("fraqueza")) {
      return "amarelo";
    }

    if (symptomsText.includes("receita") || symptomsText.includes("atestado")) {
      return "branco";
    }

    return "verde";
  }

  suggestRisk() {
    const risk = this.calculateSuggestion();
    const riskInput = document.querySelector(`[name="classification"][value="${risk}"]`);
    if (riskInput) {
      riskInput.checked = true;
    }
    this.dom.riskSuggestion.textContent = `Sugestão: ${this.priorityLabels[risk]}`;
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(this.dom.triageForm);
    const classification = this.normalizeClassification(formData.get("classification"));
    const bloodPressure = String(formData.get("bloodPressure") || "").trim();
    const temperature = String(formData.get("temperature") || "").trim();
    const oxygen = String(formData.get("oxygen") || "").trim();
    const symptoms = String(formData.get("symptoms") || "").trim();

    if (!this.state.selectedPatientId || !bloodPressure || !temperature || !oxygen || !symptoms) {
      this.callbacks.showMessage(this.dom.triageMessage, "Preencha todos os dados da triagem.");
      return;
    }

    this.state.triages.push({
      id: crypto.randomUUID(),
      patientId: this.state.selectedPatientId,
      bloodPressure,
      temperature,
      oxygen,
      heartRate: String(formData.get("heartRate") || "").trim(),
      symptoms,
      classification,
      time: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    this.state.save();
    this.reset();
    this.callbacks.showMessage(this.dom.triageMessage, "Triagem registrada.");
    this.callbacks.renderAll();
  }

  reset() {
    this.dom.triageForm.reset();
    this.state.selectedPatientId = "";
    this.dom.riskSuggestion.textContent = "Sem sugestão";
    this.renderPatientOptions();
    this.renderPatientSummary();
    this.renderVitalPreview();
  }

  renderPatientOptions() {
    if (this.state.patients.length === 0) {
      this.dom.triagePatient.innerHTML = `<option value="">Nenhum paciente cadastrado</option>`;
      return;
    }

    this.dom.triagePatient.innerHTML = `<option value="">Selecionar paciente</option>` + this.state.patients.map((patient) => `
      <option value="${patient.id}">${this.state.getPatientName(patient)}</option>
    `).join("");

    this.dom.triagePatient.value = this.state.selectedPatientId;
  }

  renderPatientSummary() {
    const patient = this.state.getSelectedPatient();
    if (!patient) {
      this.dom.patientSummary.innerHTML = `<div class="empty-state">Selecione um paciente para ver o resumo.</div>`;
      return;
    }

    this.dom.patientSummary.innerHTML = `
      <div class="summary-row"><span>Nome</span><strong>${this.escapeHtml(this.state.getPatientName(patient))}</strong></div>
      <div class="summary-row"><span>Idade</span><strong>${this.escapeHtml(patient.age)}</strong></div>
      <div class="summary-row"><span>Gênero</span><strong>${this.escapeHtml(patient.gender)}</strong></div>
      <div class="summary-row"><span>Endereço</span><strong>${this.escapeHtml(patient.address)}</strong></div>
      <div class="summary-row"><span>Convênio</span><strong>${this.escapeHtml(patient.insuranceName)}</strong></div>
      <div class="summary-row"><span>Carteirinha</span><strong>${this.escapeHtml(patient.insuranceCard)}</strong></div>
      <div class="summary-row"><span>Validade</span><strong>${this.escapeHtml(patient.insuranceValidUntil || "Não informada")}</strong></div>
      <div class="summary-row"><span>Plano</span><strong>${this.escapeHtml(patient.insurancePlan)}</strong></div>
    `;
  }

  escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  renderVitalPreview() {
    const pressure = document.getElementById("bloodPressure").value || "--";
    const temperature = document.getElementById("temperature").value || "--";
    const oxygen = document.getElementById("oxygen").value || "--";
    const oxygenNumber = Number(oxygen);
    const oxygenClass = Number.isFinite(oxygenNumber) && oxygenNumber < 90 ? "alert" : "";

    this.dom.vitalPreview.innerHTML = `
      <div class="vital-row"><span>Pressão</span><strong>${pressure}</strong></div>
      <div class="vital-row"><span>Temperatura</span><strong>${temperature} °C</strong></div>
      <div class="vital-row"><span>Oxigenação</span><strong class="${oxygenClass}">${oxygen}%</strong></div>
    `;
  }
}

window.TriageController = TriageController;
