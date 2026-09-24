import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import requests
import unicodedata
import logging
import base64
import io
from difflib import get_close_matches
from difflib import SequenceMatcher

try:
    import pytesseract
    from PIL import Image
    TESSERACT_AVAILABLE = True
except Exception:
    pytesseract = None
    Image = None
    TESSERACT_AVAILABLE = False

# Setup logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- Configuration ---
CSV_PATH = "employee_dataset_tunisian.csv"
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:latest"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
LEXICON_PATH = "it_lexicon.json"
LEARNED_LEXICON_PATH = "it_lexicon_learned.json"

# --- Data Loading ---
def _resolve_dataset_path():
    csv_candidates = [CSV_PATH, "employee_dataset_tunisian.csv"]
    return next((path for path in csv_candidates if os.path.exists(path)), None)


def load_and_clean_data():
    selected_path = _resolve_dataset_path()
    if not selected_path:
        return pd.DataFrame()
    df = pd.read_csv(selected_path)
    df = df.dropna(subset=['id', 'skills', 'jobTitle'])
    df['id'] = df['id'].astype(float).astype(int)
    df['skill_list'] = df['skills'].apply(lambda x: [s.strip().lower() for s in str(x).split(',')])
    return df


def _is_upskilling_request(prompt):
    normalized = AIEngine._normalize_text(prompt)
    upskilling_keywords = {
        "formation", "training", "certificat", "certification", "upskill", "upskilling",
    }
    return any(keyword in normalized for keyword in upskilling_keywords)


def _merge_skills(existing_skills, new_skills):
    merged = []
    seen = set()
    for skill in existing_skills + new_skills:
        cleaned = str(skill).strip()
        if not cleaned:
            continue
        normalized = cleaned.lower()
        if normalized in seen:
            continue
        seen.add(normalized)
        merged.append(cleaned)
    return merged


def _add_skills_to_employees(employee_ids, skills_to_add):
    dataset_path = _resolve_dataset_path()
    if not dataset_path:
        return {"updated": [], "not_found": employee_ids, "dataset_path": None}

    df = pd.read_csv(dataset_path)
    if df.empty or 'id' not in df.columns or 'skills' not in df.columns:
        return {"updated": [], "not_found": employee_ids, "dataset_path": dataset_path}

    normalized_ids = {int(emp_id) for emp_id in employee_ids}
    found_ids = set()
    updated = []

    for idx, row in df.iterrows():
        try:
            row_id = int(float(row.get('id')))
        except Exception:
            continue
        if row_id not in normalized_ids:
            continue
        found_ids.add(row_id)
        current_skills = [s.strip() for s in str(row.get('skills', '')).split(',') if s.strip()]
        merged_skills = _merge_skills(current_skills, skills_to_add)
        df.at[idx, 'skills'] = ", ".join(merged_skills)
        updated.append({
            "id": row_id,
            "previous_skill_count": len(current_skills),
            "new_skill_count": len(merged_skills),
            "added_skills": [
                s for s in skills_to_add
                if s.lower() not in {existing.lower() for existing in current_skills}
            ],
        })

    df.to_csv(dataset_path, index=False)
    not_found = sorted(list(normalized_ids - found_ids))
    updated.sort(key=lambda item: item["id"])
    return {"updated": updated, "not_found": not_found, "dataset_path": dataset_path}


def _extract_text_with_tesseract(document_base64, mime_type, language="eng"):
    if not TESSERACT_AVAILABLE:
        return "", "Tesseract non disponible. Installez pytesseract et pillow."
    try:
        payload = str(document_base64 or "").strip()
        if not payload:
            return "", "Document OCR vide"
        if payload.startswith("data:") and "," in payload:
            payload = payload.split(",", 1)[1]
        raw_bytes = base64.b64decode(payload)
        image_stream = io.BytesIO(raw_bytes)
        image = Image.open(image_stream)
        lang = "fra+eng" if language in ["fr", "fr-FR", "fra"] else language
        text = pytesseract.image_to_string(image, lang=lang).strip()
        if not text:
            return "", "Aucun texte detecte par OCR"
        return text, None
    except Exception as exc:
        return "", f"Erreur OCR: {exc}"


# --- AI Logic ---
class AIEngine:
    _base_lexicon_cache = None
    _learned_lexicon_cache = None

    @staticmethod
    def _normalize_text(text):
        if text is None:
            return ""
        lowered = text.lower()
        ascii_text = unicodedata.normalize("NFKD", lowered).encode("ascii", "ignore").decode("ascii")
        cleaned = re.sub(r"[^a-z0-9\s\.\+\-#]", " ", ascii_text)
        return re.sub(r"\s+", " ", cleaned).strip()

    @staticmethod
    def _load_json_file(path, default_value):
        try:
            if not os.path.exists(path):
                return default_value
            with open(path, "r", encoding="utf-8") as file:
                return json.load(file)
        except Exception:
            return default_value

    @staticmethod
    def _save_json_file(path, data):
        with open(path, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)

    @staticmethod
    def _canonicalize_lexicon_map(raw_map):
        normalized_map = {}
        for canonical, aliases in raw_map.items():
            canonical_key = AIEngine._normalize_text(canonical)
            alias_values = aliases if isinstance(aliases, list) else []
            cleaned_aliases = {canonical_key}
            for alias in alias_values:
                normalized_alias = AIEngine._normalize_text(alias)
                if normalized_alias:
                    cleaned_aliases.add(normalized_alias)
            if canonical_key:
                normalized_map[canonical_key] = sorted(cleaned_aliases)
        return normalized_map

    @staticmethod
    def _call_ollama(prompt, timeout=15, json_mode=False):
        """
        Call local Ollama. Timeout réduit à 15s (au lieu de 60s) pour éviter
        de bloquer l'API quand Ollama n'est pas disponible.
        """
        payload = {"model": MODEL_NAME, "prompt": prompt, "stream": False}
        if json_mode:
            payload["format"] = "json"
        try:
            response = requests.post(OLLAMA_URL, json=payload, timeout=timeout)
            if response.status_code != 200:
                return ""
            data = response.json()
            return str(data.get("response", "")).strip()
        except requests.Timeout:
            logger.debug("Ollama timeout après %ds", timeout)
            return ""
        except Exception as exc:
            logger.debug("Ollama unavailable: %s", exc)
            return ""

    @staticmethod
    def _call_openai(prompt, timeout=20, json_mode=False):
        if not OPENAI_API_KEY:
            return ""
        payload = {
            "model": OPENAI_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        try:
            response = requests.post(
                OPENAI_API_URL,
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json=payload,
                timeout=timeout,
            )
            if response.status_code != 200:
                return ""
            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                return ""
            message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
            return str(message.get("content", "")).strip()
        except Exception as exc:
            logger.debug("OpenAI error: %s", exc)
            return ""

    @staticmethod
    def _call_llm(prompt, timeout=10, json_mode=False):
        """
        Priorité: OpenAI → Ollama → fallback rule-based.
        OpenAI est plus rapide et fiable pour l'extraction JSON.
        """
        if OPENAI_API_KEY:
            logger.debug("Tentative OpenAI...")
            result = AIEngine._call_openai(prompt, timeout=timeout, json_mode=json_mode)
            if result:
                logger.debug("OpenAI OK (%d chars)", len(result))
                return result
            logger.debug("OpenAI vide, fallback Ollama")

        logger.debug("Tentative Ollama (timeout=%ds)...", timeout)
        result = AIEngine._call_ollama(prompt, timeout=timeout, json_mode=json_mode)
        logger.debug("Ollama: %d chars", len(result) if result else 0)
        return result

    @staticmethod
    def _get_lexicon():
        if AIEngine._base_lexicon_cache is None:
            base = AIEngine._load_json_file(LEXICON_PATH, {"skills": {}, "roles": {}})
            AIEngine._base_lexicon_cache = {
                "skills": AIEngine._canonicalize_lexicon_map(base.get("skills", {})),
                "roles": AIEngine._canonicalize_lexicon_map(base.get("roles", {})),
            }
        if AIEngine._learned_lexicon_cache is None:
            learned = AIEngine._load_json_file(LEARNED_LEXICON_PATH, {"skills": {}, "roles": {}})
            AIEngine._learned_lexicon_cache = {
                "skills": AIEngine._canonicalize_lexicon_map(learned.get("skills", {})),
                "roles": AIEngine._canonicalize_lexicon_map(learned.get("roles", {})),
            }
        merged = {"skills": {}, "roles": {}}
        for bucket in ["skills", "roles"]:
            keys = set(AIEngine._base_lexicon_cache[bucket].keys()) | set(AIEngine._learned_lexicon_cache[bucket].keys())
            for key in keys:
                aliases = set(AIEngine._base_lexicon_cache[bucket].get(key, []))
                aliases.update(AIEngine._learned_lexicon_cache[bucket].get(key, []))
                merged[bucket][key] = sorted(aliases)
        return merged["skills"], merged["roles"]

    @staticmethod
    def _persist_learned_alias(category, canonical, alias):
        canonical = AIEngine._normalize_text(canonical)
        alias = AIEngine._normalize_text(alias)
        if not canonical or not alias or canonical == alias:
            return
        learned = AIEngine._load_json_file(LEARNED_LEXICON_PATH, {"skills": {}, "roles": {}})
        learned.setdefault("skills", {})
        learned.setdefault("roles", {})
        learned[category].setdefault(canonical, [])
        normalized_existing = {AIEngine._normalize_text(item) for item in learned[category][canonical]}
        if alias in normalized_existing:
            return
        learned[category][canonical].append(alias)
        AIEngine._save_json_file(LEARNED_LEXICON_PATH, learned)
        AIEngine._learned_lexicon_cache = {
            "skills": AIEngine._canonicalize_lexicon_map(learned.get("skills", {})),
            "roles": AIEngine._canonicalize_lexicon_map(learned.get("roles", {})),
        }

    @staticmethod
    def _build_it_lexicon():
        return AIEngine._get_lexicon()

    @staticmethod
    def _fuzzy_extract_terms(normalized_text, canonical_map, fuzzy_cutoff=0.78):
        found = set()
        alias_to_canonical = {
            AIEngine._normalize_text(alias): canonical
            for canonical, aliases in canonical_map.items()
            for alias in aliases
        }
        alias_list = list(alias_to_canonical.keys())

        for alias, canonical in alias_to_canonical.items():
            if not alias:
                continue
            direct_pattern = rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])"
            if re.search(direct_pattern, normalized_text):
                found.add(canonical)

        tokens = normalized_text.split()
        if not tokens:
            return found

        max_span = min(3, len(tokens))
        for span in range(1, max_span + 1):
            for start in range(0, len(tokens) - span + 1):
                candidate = " ".join(tokens[start:start + span])
                close = get_close_matches(candidate, alias_list, n=1, cutoff=fuzzy_cutoff)
                if close:
                    if abs(len(candidate) - len(close[0])) > 2:
                        continue
                    found.add(alias_to_canonical[close[0]])
        return found

    @staticmethod
    def _learn_from_prompt(normalized_text, skills_map, roles_map):
        ignored_tokens = {
            "formation", "specialisee", "specialise", "en", "pour", "sur", "et", "avec",
            "top", "exactement", "employees", "employes", "employee", "donne", "moi",
        }

        def learn_in_category(category_name, category_map):
            alias_to_canonical = {
                alias: canonical
                for canonical, aliases in category_map.items()
                for alias in aliases
            }
            alias_list = list(alias_to_canonical.keys())
            known_aliases = set(alias_list)
            for token in normalized_text.split():
                token = token.strip('.')
                if len(token) < 4 or token in ignored_tokens:
                    continue
                if token in known_aliases:
                    continue
                close = get_close_matches(token, alias_list, n=1, cutoff=0.8)
                if not close:
                    continue
                matched_alias = close[0]
                if abs(len(token) - len(matched_alias)) > 2:
                    continue
                canonical = alias_to_canonical.get(matched_alias)
                if canonical:
                    AIEngine._persist_learned_alias(category_name, canonical, token)

        learn_in_category("skills", skills_map)
        learn_in_category("roles", roles_map)

    @staticmethod
    def _extract_requested_count(prompt, default_count=15, max_count=200):
        normalized = AIEngine._normalize_text(prompt)
        count_target_words = [
            "employee", "employees", "employe", "employes", "employer", "emploer",
            "personne", "personnes", "candidat", "candidats", "profil", "profils",
            "developpeur", "developpeurs", "developer", "developers",
            "engineer", "engineers", "ingenieur", "ingenieurs", "consultant", "consultants",
            "architecte", "architectes", "analyste", "analystes", "responsable", "responsables",
            "manager", "managers", "owner", "owners", "master", "masters",
        ]

        context_pattern = (
            r"(?:top|exactement|exact|juste|seulement|only|show|donne|affiche|retourne|"
            r"recrute|recrutons|recruter|cherche|besoin|hire|hiring)?\s*"
            r"(\d{1,4})(?:\s+[a-z0-9\+\-#\.]+){0,3}\s*"
            r"(?:employees?|employes?|employe|employer|emploer|personnes?|candidats?|profils?|"
            r"developpeurs?|developers?|engineers?|ingenieurs?|consultants?|architectes?|analystes?|"
            r"responsables?|managers?|owners?|masters?)"
        )
        match = re.search(context_pattern, normalized)
        if not match:
            match = re.search(r"\btop\s*(\d{1,4})\b", normalized)
        if not match:
            match = re.search(r"\b(?:les\s+)?(\d{1,4})\s+(?:premiers?|first|top|meilleurs?)\b", normalized)
        if not match:
            match = re.search(r"\b(?:premiers?|first|top|meilleurs?)\s*(\d{1,4})\b", normalized)

        if match:
            value = int(match.group(1))
            return max(1, min(value, max_count))

        digit_matches = list(re.finditer(r"\b(\d{1,4})\b", normalized))
        tokens = normalized.split()
        if digit_matches and tokens:
            for match_obj in digit_matches:
                value = int(match_obj.group(1))
                prefix = normalized[:match_obj.start()].strip()
                idx = len(prefix.split())
                window = tokens[max(0, idx - 3): min(len(tokens), idx + 4)]
                for token in window:
                    if get_close_matches(token, count_target_words, n=1, cutoff=0.78):
                        return max(1, min(value, max_count))

        word_to_num = {
            "un": 1, "une": 1, "one": 1, "deux": 2, "two": 2, "trois": 3, "three": 3,
            "quatre": 4, "four": 4, "cinq": 5, "five": 5, "six": 6, "seven": 7, "sept": 7,
            "huit": 8, "eight": 8, "neuf": 9, "nine": 9, "dix": 10, "ten": 10,
            "quinze": 15, "fifteen": 15, "vingt": 20, "twenty": 20, "trente": 30,
            "thirty": 30, "cinquante": 50, "fifty": 50, "cent": 100, "hundred": 100,
        }
        for idx, token in enumerate(tokens):
            if token in word_to_num:
                next_token = tokens[idx + 1] if idx + 1 < len(tokens) else ""
                if get_close_matches(next_token, count_target_words, n=1, cutoff=0.78):
                    return max(1, min(word_to_num[token], max_count))

        return default_count

    @staticmethod
    def _extract_requirements_rule_based(prompt):
        normalized = AIEngine._normalize_text(prompt)
        canonical_skills, canonical_roles = AIEngine._build_it_lexicon()
        AIEngine._learn_from_prompt(normalized, canonical_skills, canonical_roles)
        canonical_skills, canonical_roles = AIEngine._build_it_lexicon()
        skills = AIEngine._fuzzy_extract_terms(normalized, canonical_skills, fuzzy_cutoff=0.78)
        roles = AIEngine._fuzzy_extract_terms(normalized, canonical_roles, fuzzy_cutoff=0.86)
        if not roles:
            roles = {"frontend", "backend", "full stack", "devops", "data scientist"}
        return sorted(list(skills)), sorted(list(roles)), "Extraction effectuee par analyse intelligente (mode tolerant aux fautes)."

    @staticmethod
    def generate_prompt_suggestions(prompt, limit=6):
        normalized = AIEngine._normalize_text(prompt)
        cleaned_prompt = prompt.strip()
        if not cleaned_prompt:
            return [
                "Formation specialisee en Java et Spring Boot pour backend, top 10 employees",
                "Formation Angular et TypeScript pour frontend, top 10 employees",
                "Formation Docker et Kubernetes pour devops, exactement 8 employes",
            ][:limit]

        skills_map, roles_map = AIEngine._build_it_lexicon()
        detected_skills = list(AIEngine._fuzzy_extract_terms(normalized, skills_map, fuzzy_cutoff=0.78))
        detected_roles = list(AIEngine._fuzzy_extract_terms(normalized, roles_map, fuzzy_cutoff=0.86))

        typo_skill_patterns = [
            (r"\b(machine learning|mach|machi|machin|machine l|ml)\b", "machine learning"),
            (r"\b(data science|data scince|data sience|data scinece)\b", "data science"),
            (r"\b(kubernetes|kibernetes|kubernets|kuberntes|k8s)\b", "kubernetes"),
            (r"\b(java|jva|jvaa|jafa)\b", "java"),
            (r"\b(python|pyhtone|pythone|pyhton)\b", "python"),
            (r"\b(angular|anglar|anguar|anguler)\b", "angular"),
            (r"\b(docker|dokcer|dockre)\b", "docker"),
        ]
        forced_skills = []
        for pattern, canonical_skill in typo_skill_patterns:
            if re.search(pattern, normalized) and canonical_skill not in forced_skills:
                forced_skills.append(canonical_skill)
        for skill in forced_skills:
            if skill not in detected_skills:
                detected_skills.append(skill)

        count = AIEngine._extract_requested_count(prompt, default_count=10)

        if detected_roles:
            primary_role = detected_roles[0]
        elif "backend" in normalized:
            primary_role = "backend"
        elif "devops" in normalized:
            primary_role = "devops"
        elif "data" in normalized and "scient" in normalized:
            primary_role = "data scientist"
        elif "full stack" in normalized or ("full" in normalized and "stack" in normalized):
            primary_role = "full stack"
        elif "front" in normalized:
            primary_role = "frontend"
        else:
            primary_role = "frontend"

        top_skills = detected_skills[:2]
        suggestions = []
        if top_skills:
            skill_text = " et ".join(top_skills)
            suggestions.append(f"Formation specialisee en {skill_text} pour {primary_role}, top {count} employees")
            suggestions.append(f"Programme de formation {skill_text} pour {primary_role}, exactement {count} employes")
        else:
            suggestions.append(f"Formation specialisee pour {primary_role}, top {count} employees")

        if "java" in normalized:
            suggestions.append(f"Formation Java et Spring Boot pour backend, top {count} employees")
        if "python" in normalized:
            suggestions.append(f"Formation Python et machine learning pour data scientist, top {count} employees")
        if "angular" in normalized or "react" in normalized:
            suggestions.append(f"Formation Frontend {(' et '.join(top_skills) if top_skills else 'Angular et React')} pour frontend, top {count} employees")
        if "docker" in normalized or "kubernetes" in normalized:
            suggestions.append(f"Formation Docker et Kubernetes pour devops, exactement {count} employes")

        if top_skills:
            suggestions.append(f"Merci de proposer top {count} employees avec priorite sur {' et '.join(top_skills)}")
        else:
            suggestions.append(f"Merci de proposer top {count} employees avec priorite sur les competences demandees")

        unique = []
        seen = set()
        for item in suggestions:
            key = AIEngine._normalize_text(item)
            if key not in seen:
                seen.add(key)
                unique.append(item)
        return unique[:limit]

    @staticmethod
    def extract_requirements(prompt):
        system_prompt = """
        Extract training requirements from the text. 
        Return ONLY a JSON object with:
        {
          "skills": ["skill1", "skill2"],
          "roles": ["role1", "role2"],
          "justification": "short reason why these were chosen"
        }
        Common roles: Frontend Developer, Backend Developer, Full Stack Developer, DevOps Engineer, Data Scientist.
        """
        try:
            llm_output = AIEngine._call_llm(
                f"{system_prompt}\n\nTraining Prompt: {prompt}",
                timeout=15,
                json_mode=True,
            )
            if llm_output:
                data = json.loads(llm_output)
                skills = data.get('skills', [])
                roles = data.get('roles', [])
                fallback_skills, fallback_roles, fallback_justification = AIEngine._extract_requirements_rule_based(prompt)
                if not skills:
                    skills = fallback_skills
                if not roles:
                    roles = fallback_roles
                justification = data.get('justification') or fallback_justification
                return skills, roles, justification
        except Exception as e:
            logger.debug("LLM extraction failed: %s. Fallback rule-based.", e)
        return AIEngine._extract_requirements_rule_based(prompt)

    @staticmethod
    def optimize_prompt(prompt):
        system_prompt = """
        Tu es un expert en formation IT. Corrige et améliore le prompt de formation suivant. 
        Rends-le professionnel, complet et techniquement précis.
        Réponds UNIQUEMENT avec le texte corrigé.
        """
        try:
            optimized = AIEngine._call_llm(f"{system_prompt}\n\nPrompt: {prompt}", timeout=8, json_mode=False)
            if optimized:
                return optimized
        except Exception:
            pass

        p = prompt.strip()
        if not p:
            return ""

        language_corrections = {
            r"\bfimation\b": "formation", r"\bformatio\b": "formation",
            r"\bcertifcat\b": "certificat", r"\bcerteficat\b": "certificat",
            r"\bdonner\b": "donnez", r"\bdonne\s?moi\b": "donnez-moi",
            r"\bles\s+([0-9]+)\s+premier\b": r"les \1 premiers",
            r"\bemploer\b": "employés", r"\bemployer\b": "employés",
            r"\bemploye\b": "employé", r"\bemployes\b": "employés",
            r"\bfrist\b": "first", r"\bfrist\s+employees\b": "first employees",
            r"\bgive\s+me\b": "give me",
        }
        for pattern, replacement in language_corrections.items():
            p = re.sub(pattern, replacement, p, flags=re.IGNORECASE)

        technical_corrections = {
            r"\bdev\b": "Développement", r"\breactjs\b": "React",
            r"\bnode\s?js\b": "Node.js", r"\bk8s\b": "Kubernetes",
            r"\bml\b": "Machine Learning", r"\bai\b": "Intelligence Artificielle",
            r"\bdockers\b": "Docker", r"\bpythone\b": "Python",
            r"\bpyhton\b": "Python", r"\bjavaa\b": "Java", r"\bjafa\b": "Java",
            r"\bfrontend\b": "Front-end", r"\bbackend\b": "Back-end",
        }
        for pattern, replacement in technical_corrections.items():
            p = re.sub(pattern, replacement, p, flags=re.IGNORECASE)

        p = re.sub(r"\s+", " ", p).strip()
        p = re.sub(r"\s+([,.;:!?])", r"\1", p)

        detected_skills, _, _ = AIEngine._extract_requirements_rule_based(p)
        requested_count = AIEngine._extract_requested_count(p, default_count=10)

        skill_text = ", ".join([s.title() for s in detected_skills[:3]]) if detected_skills else "informatique"
        wants_certificate = any(w in AIEngine._normalize_text(p) for w in ["certificat", "certificate"])
        is_english_like = any(w in AIEngine._normalize_text(p) for w in ["certificate", "employees", "give me", "top", "please"])

        if is_english_like:
            p = (f"I want a {skill_text} certification. Please provide the top {requested_count} employees."
                 if wants_certificate else
                 f"I want specialized training in {skill_text}. Please provide the top {requested_count} employees.")
        else:
            p = (f"Je veux un certificat en {skill_text}. Donnez-moi les {requested_count} premiers employés."
                 if wants_certificate else
                 f"Je souhaite une formation spécialisée en {skill_text}. Donnez-moi les {requested_count} premiers employés.")

        if "React" in p and "Redux" not in p:
            p += " avec gestion d'état Redux"
        if "Docker" in p and "Kubernetes" not in p:
            p += " et orchestration avec Kubernetes"
        if "Python" in p and any(x in p.lower() for x in ["data", "science"]):
            p += " (Pandas, NumPy, Scikit-Learn)"
        return p

    @staticmethod
    def chat_reply(message, history=None):
        safe_message = str(message or "").strip()
        if not safe_message:
            return "Je suis là. Posez-moi une question et je vous réponds tout de suite."

        normalized_message = AIEngine._normalize_text(safe_message)
        greeting_variants = {"bonjour", "bonsoir", "salut", "hello", "hi", "onjour"}
        if normalized_message in greeting_variants:
            return "Bonjour! Comment puis-je vous aider aujourd'hui ?"

        history = history if isinstance(history, list) else []
        conversation_lines = []
        for item in history[-8:]:
            role = str(item.get("role", "user")).strip().lower()
            content = str(item.get("content", "")).strip()
            if not content:
                continue
            speaker = "Utilisateur" if role == "user" else "Assistant"
            conversation_lines.append(f"{speaker}: {content}")

        conversation_block = "\n".join(conversation_lines)
        system_prompt = (
            "Tu es ChatBAT, un assistant conversationnel generaliste (francais/anglais). "
            "Tu peux repondre a des questions techniques, generales, redactionnelles et pedagogiques. "
            "Adapte le niveau de detail au contexte, sois clair, concret et structure. "
            "Si la question parle de formation IT, competences, profils ou employes, "
            "donne aussi une reponse orientee RH et upskilling."
        )
        full_prompt = (
            f"{system_prompt}\n\nContexte recent:\n{conversation_block}\n\n"
            f"Utilisateur: {safe_message}\nAssistant:"
        )
        try:
            answer = AIEngine._call_llm(full_prompt, timeout=60, json_mode=False)
            if answer:
                return answer
        except Exception:
            pass
        return AIEngine._local_chat_fallback(safe_message)

    @staticmethod
    def _local_chat_fallback(message):
        text = AIEngine._normalize_text(message)
        concept_aliases = {
            "microservice": "microservices", "micro service": "microservices",
            "micro services": "microservices", "docker": "docker", "kubernetes": "kubernetes",
            "k8s": "kubernetes", "angular": "angular", "react": "react", "api": "api",
            "rest": "api", "ci cd": "cicd", "cicd": "cicd", "devops": "devops",
            "backend": "backend", "frontend": "frontend",
        }
        concept_definitions = {
            "microservices": (
                "Un microservice est une architecture ou une application est decoupee en petits services independants. "
                "Chaque service a une responsabilite claire, peut etre deploie separement, et communique via API."
            ),
            "docker": "Docker permet de packager une application avec ses dependances dans un conteneur portable.",
            "kubernetes": "Kubernetes automatise le deploiement, le scaling et la disponibilite des conteneurs.",
            "angular": "Angular est un framework front-end TypeScript pour construire des applications web.",
            "react": "React est une bibliotheque JavaScript orientee composants pour les interfaces utilisateur.",
            "api": "Une API permet a deux applications de communiquer. En REST via HTTP (GET, POST, PUT, DELETE).",
            "cicd": "CI/CD = Integration + Deploiement Continus. Objectif: livrer le code automatiquement et rapidement.",
            "devops": "DevOps rapproche developpement et operations pour livrer plus vite avec qualite et automatisation.",
            "backend": "Le backend: logique metier, API, base de donnees, securite, performance cote serveur.",
            "frontend": "Le frontend: pages, composants, interactions, accessibilite, experience utilisateur.",
        }
        definition_triggers = ["c est quoi", "cest quoi", "what is", "what s", "explique", "definition", "definir"]
        asks_for_definition = any(trigger in text for trigger in definition_triggers)
        matched_concept = None
        for alias, canonical in concept_aliases.items():
            if alias in text:
                matched_concept = canonical
                break
        if matched_concept and (asks_for_definition or len(text.split()) <= 6):
            return concept_definitions.get(matched_concept, "")

        if any(k in text for k in ["resume", "resumer", "summary", "synthese"]):
            return "Je peux faire un resume. Collez votre texte et indiquez la taille souhaitee (court, moyen, detaille)."
        if any(k in text for k in ["traduire", "traduction", "translate"]):
            return "Je peux traduire (FR <-> EN). Envoyez le texte et precisez la langue cible."
        if any(k in text for k in ["mail", "email", "e-mail", "message professionnel"]):
            return "Je peux rediger votre email. Donnez-moi: destinataire, objectif, ton, longueur souhaitee."
        if any(k in text for k in ["compare", "difference", "vs", "versus"]):
            return "Je peux comparer. Donnez les deux options: differences cles, avantages/inconvenients, recommandation."
        if any(k in text for k in ["expliquer", "explain", "comment", "pourquoi"]):
            return "Je peux expliquer. Precisez votre niveau (debutant/intermediaire/avance) pour adapter la reponse."
        return (
            "Le moteur conversationnel est temporairement indisponible. "
            "Reessayez dans quelques secondes ou reformulez: explication, resume, traduction, comparaison."
        )


# --- Scoring helpers ---
def _normalize_phrase(value):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9\s\+\.#\-]", " ", str(value).lower())).strip()


def _tokenize_phrase(value):
    return {token for token in _normalize_phrase(value).split() if token}


def _role_affinity_weight(role, target_skills):
    """
    Poids de compatibilité skill ↔ rôle.
    Permet de favoriser des profils dont les skills demandées correspondent
    vraiment au métier (ex: Docker+Kubernetes → DevOps plutôt que Frontend).
    """
    skill_role_affinity = {
        "python":         {"data scientist": 1.25, "backend": 1.15, "devops": 1.05, "full stack": 1.05, "frontend": 0.8},
        "java":           {"backend": 1.25, "full stack": 1.1, "devops": 1.0, "frontend": 0.8, "data scientist": 0.75},
        "javascript":     {"frontend": 1.2, "full stack": 1.2, "backend": 1.0, "devops": 0.9, "data scientist": 0.7},
        "typescript":     {"frontend": 1.2, "full stack": 1.2, "backend": 1.0, "devops": 0.9, "data scientist": 0.7},
        "react":          {"frontend": 1.25, "full stack": 1.1, "backend": 0.8, "devops": 0.7, "data scientist": 0.7},
        "angular":        {"frontend": 1.25, "full stack": 1.1, "backend": 0.8, "devops": 0.7, "data scientist": 0.7},
        "docker":         {"devops": 1.25, "backend": 1.05, "full stack": 1.0, "frontend": 0.75, "data scientist": 0.9},
        "kubernetes":     {"devops": 1.3, "backend": 1.05, "full stack": 1.0, "frontend": 0.7, "data scientist": 0.9},
        "sql":            {"backend": 1.15, "data scientist": 1.2, "full stack": 1.0, "frontend": 0.75, "devops": 0.85},
        "machine learning": {"data scientist": 1.35, "backend": 0.95, "full stack": 0.85, "frontend": 0.7, "devops": 0.8},
    }
    normalized_role = _normalize_phrase(role)
    if not target_skills:
        return 1.0
    weights = []
    for skill in target_skills:
        normalized_skill = _normalize_phrase(skill)
        role_weights = skill_role_affinity.get(normalized_skill)
        if role_weights and normalized_role in role_weights:
            weights.append(role_weights[normalized_role])
    return sum(weights) / len(weights) if weights else 1.0


def _compute_role_similarity(job_title, target_roles, target_skills):
    normalized_job = _normalize_phrase(job_title)
    job_tokens = _tokenize_phrase(job_title)
    best_weighted = 0.0
    best_raw = 0.0
    for role in target_roles:
        normalized_role = _normalize_phrase(role)
        if not normalized_role:
            continue
        role_tokens = _tokenize_phrase(role)
        exact_phrase = 1.0 if normalized_role in normalized_job else 0.0
        token_overlap = (len(job_tokens & role_tokens) / max(1, len(role_tokens))) if role_tokens else 0.0
        char_similarity = SequenceMatcher(None, normalized_role, normalized_job).ratio()
        raw_similarity = max(exact_phrase, token_overlap, char_similarity * 0.85)
        weighted_similarity = raw_similarity * _role_affinity_weight(role, target_skills)
        best_raw = max(best_raw, raw_similarity)
        best_weighted = max(best_weighted, weighted_similarity)
    return best_raw, best_weighted


def calculate_priority_metrics(row, target_skills, target_roles):
    """
    Score sur 100 points, décomposé en 5 composantes équilibrées:

      1. Role fit        (35 pts) — correspondance poste / rôle demandé
      2. Skill coverage  (40 pts) — maîtrise des compétences ciblées (normalisé)
      3. Related skills  (10 pts) — compétences connexes transférables
      4. Upskillability  (10 pts) — potentiel de montée en compétence
      5. Expérience      ( 5 pts) — largeur du profil général

    Corrections vs version précédente:
      - SUPPRIMÉ: gap_points (= upskill_gap × 4.5) qui récompensait à tort
        les employés ayant le plus de lacunes.
      - CORRIGÉ: skill_points normalisé sur 40pts (exact vaut 2× partial).
      - CORRIGÉ: upskill_points repose sur transferability (pas sur le gap brut),
        ce qui favorise un profil expérimenté avec une lacune ciblée, pas un
        profil vide.
    """
    employee_skills = [str(skill).lower().strip() for skill in row.get('skill_list', []) if str(skill).strip()]

    # Compétences connexes reconnues par domaine
    related_skill_map = {
        "python":          {"pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "machine learning", "data science", "nlp"},
        "java":            {"spring boot", "microservices", "sql", "oop", "algorithms"},
        "javascript":      {"typescript", "react", "angular", "node.js", "rest api"},
        "typescript":      {"javascript", "react", "angular", "node.js"},
        "docker":          {"kubernetes", "devops", "linux", "aws", "azure"},
        "kubernetes":      {"docker", "devops", "linux", "aws", "azure"},
        "sql":             {"postgresql", "mysql", "sql server", "data science"},
        "machine learning": {"python", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "data science"},
    }

    # --- Similarité de rôle ---
    role_similarity, weighted_role_similarity = _compute_role_similarity(
        row.get('jobTitle', ''), target_roles, target_skills
    )

    # Seuil minimal: ignorer les profils trop éloignés du rôle demandé
    if role_similarity < 0.35:
        return {
            "priority_score": 0,
            "role_similarity": 0.0,
            "weighted_role_similarity": 0.0,
            "skill_coverage": 0.0,
            "related_skill_coverage": 0.0,
            "upskill_gap": float(len(target_skills)),
            "current_skill_count": len(employee_skills),
            "skill_match_count": 0,
        }

    # --- Comptage des correspondances de compétences ---
    exact_matches = 0
    partial_matches = 0
    related_matches = 0
    related_candidates = set()

    for target in target_skills:
        normalized_target = _normalize_phrase(target)
        if not normalized_target:
            continue

        if normalized_target in employee_skills:
            exact_matches += 1
            continue  # Pas besoin de vérifier fuzzy si exact trouvé

        fuzzy = get_close_matches(normalized_target, employee_skills, n=1, cutoff=0.82)
        if fuzzy:
            partial_matches += 1

        related_candidates.update(related_skill_map.get(normalized_target, set()))

    for related_skill in related_candidates:
        if related_skill in employee_skills:
            related_matches += 1

    skill_count = max(1, len(target_skills))

    # skill_coverage: fraction [0..1] des compétences couvertes (exact + 0.6 * partial)
    skill_coverage = (exact_matches + 0.6 * partial_matches) / skill_count
    skill_coverage = min(skill_coverage, 1.0)  # plafonné à 1.0

    # upskill_gap: nombre de compétences manquantes (information, non utilisée dans le score)
    upskill_gap = max(0.0, skill_count - (exact_matches + 0.6 * partial_matches))

    related_skill_coverage = (
        related_matches / max(1, len(related_candidates))
        if related_candidates else 0.0
    )

    current_skill_count = len(employee_skills)

    # transferability: à quel point le profil est large et expérimenté [0..1]
    # Plafond à 15 skills (au-delà, peu d'impact supplémentaire)
    transferability = min(current_skill_count / 15.0, 1.0)

    # -----------------------------------------------------------------------
    # COMPOSANTE 1 — Role fit (35 pts)
    # weighted_role_similarity intègre déjà l'affinité skill↔rôle
    # -----------------------------------------------------------------------
    role_points = weighted_role_similarity * 35.0

    # -----------------------------------------------------------------------
    # COMPOSANTE 2 — Skill coverage (40 pts, normalisé)
    # exact vaut 8 pts, partial vaut 4 pts, max = skill_count * 8
    # On normalise pour que le score soit toujours sur 40, peu importe le
    # nombre de compétences demandées.
    # -----------------------------------------------------------------------
    raw_skill_pts = (exact_matches * 8.0) + (partial_matches * 4.0)
    max_skill_pts = skill_count * 8.0
    skill_points = (raw_skill_pts / max_skill_pts) * 40.0

    # -----------------------------------------------------------------------
    # COMPOSANTE 3 — Related skills (10 pts)
    # Bonus pour compétences connexes (ex: Kubernetes si on cherche Docker)
    # -----------------------------------------------------------------------
    related_points = related_skill_coverage * 10.0

    # -----------------------------------------------------------------------
    # COMPOSANTE 4 — Upskillability (10 pts)
    # Récompense un profil expérimenté (large) avec une lacune ciblée.
    # Un profil vide (transferability ≈ 0) n'obtient presque rien ici,
    # contrairement à l'ancienne formule avec gap_points.
    # -----------------------------------------------------------------------
    upskill_points = (1.0 - skill_coverage) * transferability * 10.0

    # -----------------------------------------------------------------------
    # COMPOSANTE 5 — Expérience globale (5 pts)
    # Valorise la largeur du profil, plafonné à 20 skills déclarées.
    # -----------------------------------------------------------------------
    exp_points = min(current_skill_count / 20.0, 1.0) * 5.0

    score = role_points + skill_points + related_points + upskill_points + exp_points

    return {
        "priority_score": round(score, 2),
        "role_similarity": round(role_similarity, 4),
        "weighted_role_similarity": round(weighted_role_similarity, 4),
        "skill_coverage": round(skill_coverage, 4),
        "related_skill_coverage": round(related_skill_coverage, 4),
        "upskill_gap": round(upskill_gap, 4),
        "current_skill_count": current_skill_count,
        "skill_match_count": int(exact_matches),
    }


# --- Routes ---
@app.route('/')
def index():
    return jsonify({
        "service": "projASSu API",
        "status": "ok",
        "message": "Backend operationnel. Endpoints: POST /chat, /analyze, /suggestions, /optimize-prompt, /apply-training, /ocr."
    })


def generate_requirement_summary(skills, roles, requested_count):
    if not skills and not roles:
        return "No specific requirements extracted."
    skills_str = ", ".join(skills[:3]) if skills else "general competencies"
    roles_str = " and ".join(roles[:2]) if roles else "any role"
    return f"Looking for {requested_count} professional(s) in {roles_str} with expertise in {skills_str}."


def generate_skill_analysis(skills, roles, top_employee_coverage):
    if not skills:
        return "Skill profile analysis: No specific skills targeted in this search."
    required_count = len(skills)
    coverage_pct = int((top_employee_coverage if top_employee_coverage > 0 else 0) * 100)
    return (
        f"Required {required_count} key skills. "
        f"Top candidates have ~{coverage_pct}% coverage of targeted competencies, "
        f"indicating targeted upskilling opportunities."
    )


def generate_recommendation_summary(top_candidates_count, avg_score, has_perfect_match):
    if top_candidates_count == 0:
        return "No matching candidates found. Consider expanding skill requirements or job title criteria."
    if has_perfect_match:
        return f"Found {top_candidates_count} strong candidate(s) with excellent profile match. Recommended for immediate interviews."
    elif avg_score > 70:
        return f"Found {top_candidates_count} qualified candidate(s) with good skill alignment. Recommend a targeted training plan."
    else:
        return f"Found {top_candidates_count} candidate(s) with foundational skills. Upskilling program recommended."


@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json or {}
    prompt = data.get('prompt', '')
    document_content = data.get('document_content', '')
    document_name = data.get('document_name', '')
    document_base64 = data.get('document_base64', '')
    document_mime = data.get('document_mime', '')
    ocr_language = data.get('ocr_language', 'fra+eng')
    ocr_used = False
    ocr_error = None

    if not prompt and not document_content and not document_base64:
        return jsonify({"error": "Prompt or document is required"}), 400

    if document_base64 and not document_content:
        ocr_text, ocr_error = _extract_text_with_tesseract(document_base64, document_mime, language=ocr_language)
        if ocr_text:
            document_content = ocr_text
            ocr_used = True

    document_excerpt = str(document_content or '').strip()[:12000]
    if document_excerpt:
        file_label = str(document_name or 'document').strip() or 'document'
        analysis_prompt = (
            f"{prompt}\n\n"
            f"Document joint ({file_label}) a analyser pour extraire competences et roles:\n"
            f"{document_excerpt}"
        ).strip()
    else:
        analysis_prompt = prompt

    skills, roles, justification = AIEngine.extract_requirements(analysis_prompt)
    prompt_requested_count = AIEngine._extract_requested_count(analysis_prompt)
    document_requested_count = AIEngine._extract_requested_count(
        document_excerpt,
        default_count=prompt_requested_count,
    ) if document_excerpt else prompt_requested_count
    requested_count = document_requested_count
    upskilling_mode = _is_upskilling_request(analysis_prompt)

    df = load_and_clean_data()
    if df.empty:
        return jsonify({"error": "Dataset not found"}), 500

    metrics = df.apply(
        lambda row: pd.Series(calculate_priority_metrics(row, skills, roles)),
        axis=1,
    )
    df = pd.concat([df, metrics], axis=1)

    if skills:
        df['missing_skills'] = df['skill_list'].apply(
            lambda emp_skills: [skill for skill in skills if skill.lower() not in emp_skills]
        )
        df['missing_skill_count'] = df['missing_skills'].apply(len)
    else:
        df['missing_skills'] = [[] for _ in range(len(df))]
        df['missing_skill_count'] = 0

    eligible_df = df[df['priority_score'] > 0]
    if upskilling_mode and skills:
        eligible_df = eligible_df[eligible_df['missing_skill_count'] > 0]

    top_candidates = (
        eligible_df
        .sort_values(
            by=[
                'priority_score',
                'weighted_role_similarity',
                'role_similarity',
                'skill_coverage',         # ↑ plus de coverage = mieux
                'related_skill_coverage', # ↑
                'upskill_gap',            # ↑ moins de gap = mieux → ascending=True
                'missing_skill_count',    # ↑ moins de manquants = mieux → ascending=True
                'current_skill_count',    # ↑ plus expérimenté = mieux → ascending=False
                'id',                     # tie-breaker déterministe
            ],
            ascending=[
                False,  # priority_score          ↓ (meilleur en premier)
                False,  # weighted_role_similarity ↓
                False,  # role_similarity          ↓
                False,  # skill_coverage           ↓
                False,  # related_skill_coverage   ↓
                True,   # upskill_gap              ↑ (CORRIGÉ: moins de gap = mieux)
                True,   # missing_skill_count      ↑ (CORRIGÉ: moins de manquants = mieux)
                False,  # current_skill_count      ↓ (plus d'expérience = mieux)
                True,   # id                       ↑ (tie-breaker)
            ],
        )
        .head(requested_count)
    )

    results = []
    for _, row in top_candidates.iterrows():
        results.append({
            "id": int(row['id']),
            "name": f"{row['firstName']} {row['lastName']}",
            "jobTitle": row['jobTitle'],
            "current_skills": row['skills'],
            "score": float(row['priority_score']),
            "role_similarity": float(row.get('role_similarity', 0.0)),
            "skill_coverage": float(row.get('skill_coverage', 0.0)),
            "related_skill_coverage": float(row.get('related_skill_coverage', 0.0)),
            "missing_skills": row.get('missing_skills', []),
            "missing_skill_count": int(row.get('missing_skill_count', 0)),
        })

    avg_skill_coverage = max((r.get('skill_coverage', 0) for r in results), default=0) if results else 0
    avg_priority_score = max((r.get('score', 0) for r in results), default=0) if results else 0
    has_perfect_match = any(r.get('score', 0) > 95 for r in results)

    return jsonify({
        "target_skills": skills,
        "target_roles": roles,
        "ai_justification": justification,
        "requested_count": requested_count,
        "returned_count": len(results),
        "upskilling_mode": upskilling_mode,
        "ocr_used": ocr_used,
        "ocr_error": ocr_error,
        "employees": results,
        "requirement_summary": generate_requirement_summary(skills, roles, requested_count),
        "skill_analysis": generate_skill_analysis(skills, roles, avg_skill_coverage),
        "recommendation_summary": generate_recommendation_summary(len(results), avg_priority_score, has_perfect_match),
    })


@app.route('/ocr', methods=['POST'])
def run_ocr():
    data = request.json or {}
    document_base64 = data.get('document_base64', '')
    document_mime = data.get('document_mime', '')
    ocr_language = data.get('ocr_language', 'fra+eng')
    if not document_base64:
        return jsonify({"error": "document_base64 is required"}), 400
    text, error = _extract_text_with_tesseract(document_base64, document_mime, language=ocr_language)
    if error and not text:
        return jsonify({"error": error, "extracted_text": ""}), 400
    return jsonify({"extracted_text": text, "ocr_error": error})


@app.route('/apply-training', methods=['POST'])
def apply_training():
    data = request.json or {}
    employee_ids = data.get('employee_ids', [])
    skills = data.get('skills', [])
    completion_type = str(data.get('completion_type', 'formation')).strip().lower()

    if not isinstance(employee_ids, list) or not employee_ids:
        return jsonify({"error": "employee_ids list is required"}), 400
    if not isinstance(skills, list) or not skills:
        return jsonify({"error": "skills list is required"}), 400

    cleaned_skills = [str(skill).strip() for skill in skills if str(skill).strip()]
    if not cleaned_skills:
        return jsonify({"error": "skills list is empty after cleaning"}), 400

    try:
        normalized_ids = [int(emp_id) for emp_id in employee_ids]
    except Exception:
        return jsonify({"error": "employee_ids must contain integers"}), 400

    update_result = _add_skills_to_employees(normalized_ids, cleaned_skills)
    if update_result["dataset_path"] is None:
        return jsonify({"error": "Dataset not found"}), 500

    return jsonify({
        "status": "success",
        "completion_type": completion_type,
        "skills_applied": cleaned_skills,
        "updated_employees": update_result["updated"],
        "not_found_employee_ids": update_result["not_found"],
        "updated_count": len(update_result["updated"]),
    })


@app.route('/optimize-prompt', methods=['POST'])
def optimize():
    data = request.json
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
    optimized = AIEngine.optimize_prompt(prompt)
    return jsonify({"optimized_prompt": optimized})


@app.route('/suggestions', methods=['POST'])
def suggestions():
    data = request.json or {}
    prompt = data.get('prompt', '')
    limit = data.get('limit', 6)
    try:
        limit = int(limit)
    except Exception:
        limit = 6
    limit = max(1, min(limit, 12))
    suggestions_list = AIEngine.generate_prompt_suggestions(prompt, limit=limit)
    return jsonify({"prompt": prompt, "suggestions": suggestions_list})


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = str(data.get('message', '')).strip()
    history = data.get('history', [])
    if not message:
        return jsonify({"error": "Message is required"}), 400
    reply = AIEngine.chat_reply(message, history=history)
    return jsonify({"reply": reply})


@app.errorhandler(405)
def handle_method_not_allowed(_error):
    return jsonify({
        "error": "Method Not Allowed",
        "message": "Use POST for this endpoint.",
        "path": request.path,
        "method": request.method,
        "examples": {
            "analyze": "POST /analyze",
            "chat": "POST /chat",
            "suggestions": "POST /suggestions",
            "optimize_prompt": "POST /optimize-prompt",
            "apply_training": "POST /apply-training",
            "ocr": "POST /ocr",
        }
    }), 405


if __name__ == '__main__':
    app.run(debug=True, port=5000)