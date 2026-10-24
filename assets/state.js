class AppState {
  constructor(patientStorageKey, triageStorageKey) {
    this.patientStorageKey = patientStorageKey;
    this.triageStorageKey = triageStorageKey;

    try {
      this.patients = JSON.parse(localStorage.getItem(patientStorageKey) || "[]");
      this.triages = JSON.parse(localStorage.getItem(triageStorageKey) || "[]");
    } catch (error) {
      this.patients = [];
      this.triages = [];
      console.warn("Não foi possível carregar os dados salvos.", error);
    }

    this.activeScreen = "cadastro";
    this.selectedPatientId = "";
  }

  save() {
    localStorage.setItem(this.patientStorageKey, JSON.stringify(this.patients));
    localStorage.setItem(this.triageStorageKey, JSON.stringify(this.triages));
  }

  getPatientName(patient) {
    return `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Paciente";
  }

  getSelectedPatient() {
    return this.patients.find((patient) => patient.id === this.selectedPatientId) || null;
  }
}

window.AppState = AppState;
