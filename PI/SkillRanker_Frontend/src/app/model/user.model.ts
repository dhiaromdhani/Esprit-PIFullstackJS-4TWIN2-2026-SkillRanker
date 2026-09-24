export interface User {
  _id?: string;
  name: string;
  matricule?: string;
  telephone?: string;
  email: string;
  role: 'ADMINISTRATOR' | 'EMPLOYEE' | 'MANAGER' | 'HR_MANAGER';
  dateEmbauche?: string;
  department?: any;
  manager?: any;
  status?: string;
  enLigne?: boolean;
  picture:string
}