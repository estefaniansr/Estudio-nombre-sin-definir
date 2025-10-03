export interface Archivo {
  url: string;
  nombre: string;
}
export interface Materia {
  nombre: string;
  descripcion: string;
  imagen: string;
  titulos: string[];
  expandida: boolean;
  favorito: boolean;
  archivos?:  Archivo[]; // URLs de archivos subidos a Filestack
}