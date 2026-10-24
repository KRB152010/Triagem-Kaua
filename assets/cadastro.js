class PatientRegistration {
  constructor(state, dom, callbacks) {
    this.state = state;
    this.dom = dom;
    this.callbacks = callbacks;
  }

  init() {
    this.dom.patientForm.addEventListener("submit", (event) => this.handleSubmit(event));
    this.dom.clearPatientForm.addEventListener("click", () => this.reset());
    this.dom.patientSearch.addEventListener("input", () => this.render());
    this.dom.patientList.addEventListener("click", (event) => this.handleListClick(event));
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(this.dom.patientForm);
    const patient = {
      id: crypto.randomUUID(),
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      age: String(formData.get("age") || "").trim(),
      gender: String(formData.get("gender") || "").trim(),
      address: String(formData.get("address") || "").trim(),
      insuranceName: String(formData.get("insuranceName") || "").trim(),
      insuranceCard: String(formData.get("insuranceCard") || "").trim(),
      insuranceValidUntil: String(formData.get("insuranceValidUntil") || "").trim(),
      insurancePlan: String(formData.get("insurancePlan") || "Enfermaria").trim(),
      createdAt: new Date().toISOString()
    };

    if (!patient.firstName || !patient.lastName || !patient.age || !patient.gender || !patient.address || !patient.insuranceName || !patient.insuranceCard) {
      this.callbacks.showMessage(this.dom.patientMessage, "Preencha os campos obrigatórios.");
      return;
    }

    this.state.patients.push(patient);
    this.state.selectedPatientId = patient.id;
    this.state.save();
    this.reset();
    this.callbacks.renderAll();
    this.callbacks.setScreen("triagem");
    this.callbacks.showTriageMessage("Paciente cadastrado e selecionado para triagem.");
  }

  handleListClick(event) {
    const selectButton = event.target.closest("[data-select-patient]");
    const deleteButton = event.target.closest("[data-delete-patient]");

    if (selectButton) {
      this.state.selectedPatientId = selectButton.dataset.selectPatient;
      this.callbacks.setScreen("triagem");
      this.callbacks.renderAll();
      return;
    }

    if (deleteButton) {
      const patientId = deleteButton.dataset.deletePatient;
      const patientIndex = this.state.patients.findIndex((patient) => patient.id === patientId);

      if (patientIndex === -1) {
        return;
      }

      const [removedPatient] = this.state.patients.splice(patientIndex, 1);
      if (removedPatient) {
        this.state.triages = this.state.triages.filter((triage) => triage.patientId !== removedPatient.id);
      }

      this.state.save();
      this.callbacks.renderAll();
    }
  }

  reset() {
    this.dom.patientForm.reset();
    this.dom.patientMessage.textContent = "";
  }

  render() {
    const searchText = this.dom.patientSearch.value.trim().toLowerCase();
    const patients = this.state.patients.filter((patient) => {
      const patientName = this.state.getPatientName(patient).toLowerCase();
      return patientName.includes(searchText);
    });

    if (patients.length === 0) {
      this.dom.patientList.innerHTML = `<div class="empty-state">Nenhum paciente na recepção.</div>`;
      return;
    }

    this.dom.patientList.innerHTML = patients.map((patient) => `
      <article class="patient-card">
        <header>
          <div>
            <strong>${this.state.getPatientName(patient)}</strong>
            <small>${patient.age} anos · ${patient.gender}</small>
          </div>
          <span class="tag">${patient.insurancePlan}</span>
        </header>
        <div class="meta-line">${patient.address}</div>
        <div class="meta-line">${patient.insuranceName} · ${patient.insuranceCard}</div>
        <div class="patient-actions">
          <button class="small-button" data-select-patient="${patient.id}" type="button">Triar</button>
          <button class="small-button danger-button" data-delete-patient="${patient.id}" type="button">Remover</button>
        </div>
      </article>
    `).join("");
  }
}

window.PatientRegistration = PatientRegistration;
