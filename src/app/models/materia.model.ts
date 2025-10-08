export interface Archivo {
  url: string;
  nombre: string;
  subidoPor?: string;  // email
  fechaSubida?: Date;
}
export interface Materia {
  id?: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  titulos: string[];
  expandida: boolean;
  favorito: boolean;
  archivos?: Archivo[]; // URLs de archivos subidos a Filestack
  editandoDescripcion?: boolean;
  descripcionTemp?: string;
}