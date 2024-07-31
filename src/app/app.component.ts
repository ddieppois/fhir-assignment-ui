import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {PatientListComponent} from "./patient-list/patient-list.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PatientListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'fhir-assignment-ui';
}
