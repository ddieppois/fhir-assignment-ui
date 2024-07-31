import { Component, OnInit } from '@angular/core';
import { Patient } from "../models/patient";
import { FhirApiService } from "../services/fhir-api.service";
import { MatListItem, MatNavList } from "@angular/material/list";
import { MatCard, MatCardContent, MatCardTitle } from "@angular/material/card";
import { MatButton } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatToolbar } from "@angular/material/toolbar";
import { AllergyIntolerance } from "../models/allergy-intolerance";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { AllergyUpdateRequest } from "../models/allergy-update-request";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    MatCard,
    FormsModule,
    CommonModule,
    MatToolbar,
    MatCardContent,
    MatNavList,
    MatListItem,
    MatButton,
    MatLabel,
    MatCardTitle,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatIcon
  ],
  templateUrl: './patient-list.component.html',
  styleUrls: ['./patient-list.component.css']
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  selectedPatientAllergies: AllergyIntolerance[] = [];
  selectedPatientId: string | null = null;
  selectedPatientName: string | null = null;
  allergyForm: FormGroup;
  originalAllergies: AllergyIntolerance[] = [];
  isSubmitting = false;
  saveSuccess = false;
  saveError = false;

  constructor(private fhirService: FhirApiService, private fb: FormBuilder) {
    this.allergyForm = this.fb.group({
      allergies: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.fhirService.getPatientsWithAllergies().subscribe(data => {
      this.patients = data;
    });

    this.allergyForm.valueChanges.subscribe(() => {
      this.allergyForm.markAsDirty();
    });
  }

  onPatientClick(patientId: string): void {
    this.selectedPatientId = patientId;
    const selectedPatient = this.patients.find(patient => patient.id === patientId);
    this.selectedPatientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '';
    this.fhirService.getAllergiesForPatient(patientId).subscribe((data: AllergyIntolerance[]) => {
      this.selectedPatientAllergies = data;
      this.originalAllergies = JSON.parse(JSON.stringify(data));
      this.setAllergiesForm(data);
      this.allergyForm.markAsPristine();
    });
  }

  setAllergiesForm(allergies: AllergyIntolerance[]): void {
    const allergyFGs = allergies.map(allergy => this.fb.group({
      id: [allergy.id],
      code: [allergy.code],
      type: [allergy.type],
      clinicalStatus: [allergy.clinicalStatus],
      verificationStatus: [allergy.verificationStatus],
      note: [allergy.note],
      reactions: this.fb.array(allergy.reactions.map(reaction => this.fb.group({
        substance: [reaction.substance],
        manifestations: [reaction.manifestations.join(', ')],
        description: [reaction.description]
      })))
    }));
    const allergyFormArray = this.fb.array(allergyFGs);
    this.allergyForm.setControl('allergies', allergyFormArray);
  }

  onDeleteAllergy(index: number) {
    (this.allergyForm.get('allergies') as FormArray).removeAt(index);
    this.allergyForm.markAsDirty();
  }

  get allergies(): FormArray {
    return this.allergyForm.get('allergies') as FormArray;
  }

  getReactionsFormArray(allergyIndex: number): FormArray {
    return this.allergies.at(allergyIndex).get('reactions') as FormArray;
  }

  onAddAllergy() {
    const allergyArray = this.allergyForm.get('allergies') as FormArray;
    const newAllergy = this.fb.group({
      id: [''],
      code: [''],
      type: [''],
      clinicalStatus: [''],
      verificationStatus: [''],
      note: [''],
      reactions: this.fb.array([this.createReaction()])
    });
    allergyArray.push(newAllergy);
    this.allergyForm.markAsDirty();
  }

  createReaction(): FormGroup {
    return this.fb.group({
      substance: [''],
      manifestations: [''],
      description: ['']
    });
  }

  onAddReaction(allergyIndex: number) {
    const reactionsArray = this.getReactionsFormArray(allergyIndex);
    reactionsArray.push(this.createReaction());
    this.allergyForm.markAsDirty();
  }

  onDeleteReaction(allergyIndex: number, reactionIndex: number) {
    const reactionsArray = this.getReactionsFormArray(allergyIndex);
    reactionsArray.removeAt(reactionIndex);
    this.allergyForm.markAsDirty();
  }

  onSubmit() {
    if (this.selectedPatientId) {
      this.isSubmitting = true;
      this.saveSuccess = false;
      this.saveError = false;

      const updatedAllergies = this.allergyForm.value.allergies.map((allergy: any) => ({
        ...allergy,
        reactions: allergy.reactions.map((reaction: any) => ({
          ...reaction,
          manifestations: reaction.manifestations.split(', ').map((manifestation: string) => manifestation.trim())
        }))
      }));

      const modifiedAllergies = updatedAllergies.filter((updated: AllergyIntolerance) => {
        const original = this.originalAllergies.find(o => o.id === updated.id);
        if (!original) {
          return true; // new allergy
        }
        return JSON.stringify(original) !== JSON.stringify(updated);
      });

      const deletedAllergies = this.originalAllergies.filter((original: AllergyIntolerance) =>
        !updatedAllergies.some((updated: AllergyIntolerance) => updated.id === original.id)
      );

      const request: AllergyUpdateRequest = { updatedAllergies: modifiedAllergies, deletedAllergies };
      this.fhirService.updateAllergiesForPatient(this.selectedPatientId, request).subscribe(
        () => {
          this.saveSuccess = true;
          this.isSubmitting = false;
          this.allergyForm.markAsPristine(); // Mark the form as pristine to disable the button again
        },
        () => {
          this.saveError = true;
          this.isSubmitting = false;
        }
      );
    }
  }

  printPatientAllergies() {
    const printContent = this.generatePrintContent();
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Print Allergies</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        .allergy-card {
          border: 1px solid #000;
          margin-bottom: 20px;
          padding: 10px;
        }
        .reaction-group {
          margin-bottom: 10px;
        }
      `);
      printWindow.document.write('</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<h2>Allergies for Patient: ' + this.selectedPatientName + '</h2>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  }

  generatePrintContent(): string {
    let content = '';
    this.allergies.controls.forEach((allergyGroup, i) => {
      const allergy = allergyGroup.value;
      content += `<div class="allergy-card"><h3>Allergy ${i + 1}</h3>`;
      content += `<p><strong>Code:</strong> ${allergy.code || ''}</p>`;
      content += `<p><strong>Type:</strong> ${allergy.type || ''}</p>`;
      content += `<p><strong>Clinical Status:</strong> ${allergy.clinicalStatus || ''}</p>`;
      content += `<p><strong>Verification Status:</strong> ${allergy.verificationStatus || ''}</p>`;
      content += `<p><strong>Note:</strong> ${allergy.note || ''}</p>`;
      content += `<h4>Reactions:</h4>`;
      allergy.reactions.forEach((reaction: any) => {
        content += `<div class="reaction-group">`;
        content += `<p><strong>Substance:</strong> ${reaction.substance || ''}</p>`;
        content += `<p><strong>Manifestations:</strong> ${reaction.manifestations || ''}</p>`;
        content += `<p><strong>Description:</strong> ${reaction.description || ''}</p>`;
        content += `</div>`;
      });
      content += `</div>`;
    });
    return content;
  }
}
