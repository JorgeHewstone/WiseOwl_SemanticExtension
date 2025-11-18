import nltk
from nltk.corpus import wordnet
from sentence_transformers import SentenceTransformer, util
import json
import os

# --- 1. Configuración de NLTK ---
# Descarga 'wordnet' si no está presente
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    print("Downloading 'wordnet' data from NLTK...")
    nltk.download('wordnet')

# --- 2. Configuración del Script ---
# (Pega tu lista de 100+ tópicos aquí)
base_topics =base_topics = [
    "Biology",
    "Physics",
    "Chemistry",
    "Mathematics",
    "Computer Science",
    "Engineering",
    "Medicine",
    "Psychology",
    "Sociology",
    "Anthropology",
    "Archaeology",
    "Economics",
    "Political Science",
    "Philosophy",
    "Linguistics",
    "History",
    "Geography",
    "Law",
    "Art",
    "Music",
    "Literature",
    "Theater",
    "Film",
    "Architecture",
    "Design",
    "Education",
    "Environmental Science",
    "Ecology",
    "Geology",
    "Astronomy",
    "Statistics",
    "Data Science",
    "Artificial Intelligence",
    "Robotics",
    "Nanotechnology",
    "Biotechnology",
    "Genetics",
    "Neuroscience",
    "Agriculture",
    "Nutrition",
    "Public Health",
    "Epidemiology",
    "Business",
    "Finance",
    "Marketing",
    "Entrepreneurship",
    "Innovation",
    "Management",
    "Ethics",
    "Cognitive Science",
    "Cybersecurity",
    "Blockchain",
    "Cryptography",
    "Quantum Computing",
    "Virtual Reality",
    "Augmented Reality",
    "Energy",
    "Renewable Energy",
    "Transportation",
    "Urban Planning",
    "Oceanography",
    "Meteorology",
    "Climate Science",
    "Forestry",
    "Marine Biology",
    "Zoology",
    "Botany",
    "Sociolinguistics",
    "Communication",
    "Journalism",
    "Cultural Studies",
    "Gender Studies",
    "Religious Studies",
    "Mythology",
    "Sports Science",
    "Human Evolution",
    "Ecological Conservation",
    "Supply Chain",
    "International Relations",
    "Demography",
    "Geopolitics",
    "Behavioral Science",
    "Game Theory",
    "Decision Theory",
    "Information Theory",
    "Systems Theory",
    "Topology",
    "Number Theory",
    "Geometry",
    "Mechanics",
    "Thermodynamics",
    "Electromagnetism",
    "Astronautics",
    "Futurology",
    "Transhumanism",
    "Artificial Life",
    "Creative Writing",
    "Media Studies",
    "Social Work",
    "Cognitive Development"
]


TOP_K_KEYWORDS = 50  # Cuántas palabras clave relacionadas encontrar por tópico
OUTPUT_DIR = 'public/data'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'topics.json')

# --- 3. Generar Palabras Clave Candidatas desde WordNet ---
print("Generating candidate keywords from WordNet... (Esto puede tardar un minuto)")
candidate_set = set()

# Itera sobre todos los "synsets" (grupos de sinónimos) en WordNet
for synset in wordnet.all_synsets():
    # Obtiene todas las "lemmas" (palabras) en ese grupo
    for lemma in synset.lemmas():
        # Limpia la palabra: 'machine_learning' -> 'machine learning'
        keyword = lemma.name().lower().replace('_', ' ')
        
        # Filtro simple para mantener la lista manejable
        if 2 < len(keyword) < 30:
            candidate_set.add(keyword)

candidate_keywords = list(candidate_set)
print(f"Generated {len(candidate_keywords)} unique candidate keywords from WordNet.")

# --- 4. Cargar el Modelo de IA ---
print("Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
# Este modelo es rápido y el mismo que usa transformers.js
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- 5. Codificar Palabras Clave (El Paso Lento) ---
print(f"Encoding {len(candidate_keywords)} keywords... (Esto es lento y usa RAM)")
# Codifica el corpus de candidatos UNA SOLA VEZ
corpus_embeddings = model.encode(
    candidate_keywords, 
    convert_to_tensor=True, 
    show_progress_bar=True
)

# --- 6. Codificar los Tópicos Base ---
print(f"Encoding {len(base_topics)} base topics...")
topic_embeddings = model.encode(
    base_topics, 
    convert_to_tensor=True, 
    show_progress_bar=True
)

# --- 7. Encontrar Coincidencias Semánticas ---
print(f"Finding top {TOP_K_KEYWORDS} keywords for each topic...")
# Compara todos los tópicos contra todo el corpus de una sola vez
top_results = util.semantic_search(
    topic_embeddings, 
    corpus_embeddings, 
    top_k=TOP_K_KEYWORDS
)

# --- 8. Construir la Base de Datos JSON ---
topic_database = {}
print("Building the final JSON database...")

for i, topic in enumerate(base_topics):
    keywords_for_topic = []
    
    # Itera sobre los resultados para este tópico
    for hit in top_results[i]: # top_results[i] son los resultados para el i-ésimo tópico
        keyword = candidate_keywords[hit['corpus_id']]
        keywords_for_topic.append(keyword)
    
    # Agrega el tópico original a la lista, por si acaso
    keywords_for_topic.append(topic.lower())
    
    # De-duplica y almacena
    topic_database[topic] = list(set(keywords_for_topic))
    
    print(f"  > Topic: '{topic}' -> Top match: '{keywords_for_topic[0]}'")

# --- 9. Guardar el Archivo JSON ---
# Asegura que la carpeta public/data exista
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(OUTPUT_FILE, 'w') as f:
    json.dump(topic_database, f, indent=2)

print(f"\n--- ¡ÉXITO! ---")
print(f"Se generó el archivo {OUTPUT_FILE} con {len(base_topics)} tópicos.")