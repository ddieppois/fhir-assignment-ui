import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from "../models/patient";
import { AllergyIntolerance } from "../models/allergy-intolerance";
import { AllergyUpdateRequest } from "../models/allergy-update-request";

@Injectable({
  providedIn: 'root'
})
export class FhirApiService {

  private baseUrl = 'http://localhost:8080/api/patients/';

  constructor(private http: HttpClient) { }

  getPatientsWithAllergies(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}with-allergies`);
  }

  getAllergiesForPatient(patientId: string): Observable<AllergyIntolerance[]> {
    return this.http.get<AllergyIntolerance[]>(`${this.baseUrl}${patientId}/allergies`);
  }

  updateAllergiesForPatient(patientId: string, allergies: AllergyUpdateRequest): Observable<void> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<void>(`${this.baseUrl}${patientId}/allergies`, allergies, { headers });
  }
}
