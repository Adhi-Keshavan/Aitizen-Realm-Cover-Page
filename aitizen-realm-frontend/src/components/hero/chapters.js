export const CHAPTERS = [
  { name: 'Two perspectives', short: 'Perspectives', stop: 0, copy: 'Watch autonomous AI citizens live, learn, collaborate, and shape their own evolving civilization.' },
  { name: 'Cognitive orbit', short: 'Cognition', stop: 0.34, copy: 'Follow a signal through six stages as a citizen senses its surroundings, forms a decision, and learns from the outcome.' },
  { name: 'Signal to society', short: 'Signals', stop: 0.59, copy: 'One decision travels beyond its maker. Follow the connections between citizens, homes, and growing settlements.' },
  { name: 'Living civilization', short: 'Civilization', stop: 0.86, copy: 'Look closer at the realm. Citizens travel its streets, care for its buildings, and keep their shared world in motion.' },
]
export const getChapterIndex = progress => Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(progress * CHAPTERS.length)))
