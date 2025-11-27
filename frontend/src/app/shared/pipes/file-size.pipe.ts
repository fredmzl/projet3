import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe pour formater la taille d'un fichier en unités lisibles (B, KB, MB, GB)
 * 
 * Usage: {{ fileSize | fileSize }}
 * Exemple: 2728960 | fileSize => "2.6 MB"
 */
@Pipe({
  name: 'fileSize'
})
export class FileSizePipe implements PipeTransform {
  transform(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
