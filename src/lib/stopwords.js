/**
 * stopwords.js — words excluded from "top words" so the signal isn't drowned
 * by glue words. English-centric with the chat fillers WhatsApp is full of.
 */
export const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','then','so','because','as','of','at','by',
  'for','with','about','against','between','into','through','during','before','after',
  'to','from','up','down','in','out','on','off','over','under','again','further',
  'is','am','are','was','were','be','been','being','have','has','had','having','do',
  'does','did','doing','will','would','should','could','can','may','might','must',
  'i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself',
  'he','him','his','she','her','hers','it','its','they','them','their','what','which',
  'who','whom','this','that','these','those','here','there','when','where','why','how',
  'all','any','both','each','few','more','most','other','some','such','no','nor','not',
  'only','own','same','than','too','very','just','dont','cant','im','ill','ive','id',
  'u','ur','im','ok','okay','yeah','yes','no','yep','nope','lol','haha','hahaha','hmm',
  'oh','ah','um','uh','like','get','got','go','going','one','also','really','actually',
  'thing','things','wanna','gonna','gotta','bro','dude','man','well','now','still',
  'were','theyre','youre','its','thats','whats','lets','dont','didnt','doesnt','isnt',
  'wasnt','arent','wont','aint','na',' na','yaar','bhai','hai','ho','ke','ki','ka','to',
])

/** Normalise a token for word-frequency: lower-case, strip punctuation/emoji. */
export function normalizeWord(w) {
  return w
    .toLowerCase()
    .replace(/[\p{P}\p{S}\p{C}]/gu, '') // drop punctuation, symbols, controls
    .trim()
}
