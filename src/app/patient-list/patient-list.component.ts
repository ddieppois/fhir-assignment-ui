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
    MatInput
  ],
  templateUrl: './patient-list.component.html',
  styleUrl: './patient-list.component.css'
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  selectedPatientAllergies: AllergyIntolerance[] = [];
  selectedPatientId: string | null = null;
  selectedPatientName: string | null = null;
  allergyForm: FormGroup;
  originalAllergies: AllergyIntolerance[] = [];

  constructor(private fhirService: FhirApiService, private fb: FormBuilder) {
    this.allergyForm = this.fb.group({
      allergies: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.fhirService.getPatientsWithAllergies().subscribe(data => {
      this.patients = data;
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
  }

  createReaction(): FormGroup {
    return this.fb.group({
      substance: [''],
      manifestations: [''],
      description: ['']
    });
  }

  onSubmit() {
    if (this.selectedPatientId) {
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
      console.log(request);
      this.fhirService.updateAllergiesForPatient(this.selectedPatientId, request).subscribe();
    }
  }
}
