import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Format personnalisé pour les logs en mode développement
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Crée une instance de logger
const logger = winston.createLogger({
  // Niveau de log minimum à capturer
  level: process.env.LOG_LEVEL || 'info',
  
  // Format des logs
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Si en production, utiliser le format JSON, sinon un format coloré pour la console
    process.env.NODE_ENV === 'production'
      ? json()
      : combine(colorize(), devFormat)
  ),
  
  // Destination des logs (ici, la console)
  transports: [new winston.transports.Console()],
  
  // Ne pas quitter en cas d'erreur non gérée (laisser le processus décider)
  exitOnError: false,
});

export { logger };
