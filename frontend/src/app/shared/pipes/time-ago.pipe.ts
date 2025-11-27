import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe pour afficher une date en format relatif (il y a X jours, etc.)
 * 
 * Usage: {{ date | timeAgo }}
 * Exemple: "2025-01-10" | timeAgo => "il y a 5 jours"
 */
@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'à l\'instant';
    } else if (diffMinutes < 60) {
      return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  }
}
