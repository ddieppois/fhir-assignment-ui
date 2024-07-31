import {ReactionDetails} from "./reaction-details";

export interface AllergyIntolerance {
  id: string;
  code: string;
  type: string;
  clinicalStatus: string;
  verificationStatus: string;
  note: string;
  reactions: ReactionDetails[];
}
