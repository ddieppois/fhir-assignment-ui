import {AllergyIntolerance} from "./allergy-intolerance";

export interface AllergyUpdateRequest {
  updatedAllergies: AllergyIntolerance[];
  deletedAllergies: AllergyIntolerance[];
}
