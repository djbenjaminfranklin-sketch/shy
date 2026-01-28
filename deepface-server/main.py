"""
SHY Face Verification Server
Utilise DeepFace pour comparer les visages et détecter les faux profils
"""

import os
import tempfile
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deepface import DeepFace
import numpy as np

app = FastAPI(
    title="SHY Face Verification API",
    description="API de vérification faciale pour l'application SHY",
    version="1.0.0"
)

# CORS - autoriser les requêtes depuis Supabase Edge Functions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SIMILARITY_THRESHOLD = 0.6  # Seuil de distance (plus bas = plus strict)
MIN_MATCHING_PHOTOS = 2  # Minimum de photos qui doivent correspondre
MODEL_NAME = "ArcFace"  # Modèle le plus précis
DETECTOR_BACKEND = "retinaface"  # Détecteur de visage précis

# Secret pour sécuriser l'API (à configurer en variable d'environnement)
API_SECRET = os.getenv("API_SECRET", "shy-verification-secret-change-me")


class VerifyFaceRequest(BaseModel):
    profile_photo_url: str
    verification_photo_urls: list[str]
    user_id: str
    api_secret: str


class ComparisonResult(BaseModel):
    photo_index: int
    matched: bool
    distance: float
    similarity_percent: float
    error: str | None = None


class VerifyFaceResponse(BaseModel):
    verified: bool
    confidence: float
    matched_photos: int
    total_photos: int
    details: list[ComparisonResult]
    error: str | None = None


async def download_image(url: str) -> str:
    """Télécharge une image et retourne le chemin du fichier temporaire"""
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()

        # Créer un fichier temporaire
        suffix = ".jpg"
        if "png" in url.lower() or "png" in response.headers.get("content-type", ""):
            suffix = ".png"

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            f.write(response.content)
            return f.name


def compare_faces(source_path: str, target_path: str) -> dict:
    """Compare deux visages et retourne le résultat"""
    try:
        result = DeepFace.verify(
            img1_path=source_path,
            img2_path=target_path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
        )

        distance = result["distance"]
        threshold = result["threshold"]
        verified = result["verified"]

        # Convertir la distance en pourcentage de similarité
        # Distance 0 = 100% similaire, Distance >= threshold = 0%
        similarity_percent = max(0, min(100, (1 - distance / threshold) * 100))

        return {
            "matched": verified,
            "distance": round(distance, 4),
            "similarity_percent": round(similarity_percent, 2),
            "error": None
        }
    except Exception as e:
        error_msg = str(e)
        # Erreurs courantes
        if "Face could not be detected" in error_msg:
            error_msg = "Visage non détecté dans l'image"
        elif "Confirm that the picture is a face" in error_msg:
            error_msg = "L'image ne semble pas contenir un visage"

        return {
            "matched": False,
            "distance": 1.0,
            "similarity_percent": 0,
            "error": error_msg
        }


@app.get("/health")
async def health_check():
    """Endpoint de santé pour vérifier que le serveur fonctionne"""
    return {"status": "healthy", "model": MODEL_NAME}


@app.post("/verify", response_model=VerifyFaceResponse)
async def verify_face(request: VerifyFaceRequest):
    """
    Compare les photos de vérification avec la photo de profil
    Retourne verified=true si au moins MIN_MATCHING_PHOTOS correspondent
    """
    # Vérifier le secret API
    if request.api_secret != API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API secret")

    if not request.profile_photo_url or not request.verification_photo_urls:
        raise HTTPException(status_code=400, detail="Missing required parameters")

    print(f"[Verify] Starting verification for user {request.user_id}")
    print(f"[Verify] Profile photo: {request.profile_photo_url}")
    print(f"[Verify] Verification photos: {len(request.verification_photo_urls)}")

    temp_files = []

    try:
        # Télécharger la photo de profil
        profile_photo_path = await download_image(request.profile_photo_url)
        temp_files.append(profile_photo_path)

        # Comparer chaque photo de vérification
        results: list[ComparisonResult] = []
        matched_count = 0
        total_similarity = 0

        for i, verification_url in enumerate(request.verification_photo_urls):
            try:
                # Télécharger la photo de vérification
                verification_path = await download_image(verification_url)
                temp_files.append(verification_path)

                # Comparer les visages
                comparison = compare_faces(profile_photo_path, verification_path)

                result = ComparisonResult(
                    photo_index=i,
                    matched=comparison["matched"],
                    distance=comparison["distance"],
                    similarity_percent=comparison["similarity_percent"],
                    error=comparison["error"]
                )
                results.append(result)

                if comparison["matched"]:
                    matched_count += 1
                total_similarity += comparison["similarity_percent"]

                print(f"[Verify] Photo {i + 1}: similarity={comparison['similarity_percent']}%, matched={comparison['matched']}")

            except Exception as e:
                print(f"[Verify] Error processing photo {i}: {e}")
                results.append(ComparisonResult(
                    photo_index=i,
                    matched=False,
                    distance=1.0,
                    similarity_percent=0,
                    error=str(e)
                ))

        # Calculer le résultat final
        verified = matched_count >= MIN_MATCHING_PHOTOS
        average_confidence = total_similarity / len(results) if results else 0

        print(f"[Verify] Final result: verified={verified}, matched={matched_count}/{len(results)}")

        return VerifyFaceResponse(
            verified=verified,
            confidence=round(average_confidence, 2),
            matched_photos=matched_count,
            total_photos=len(results),
            details=results,
            error=None
        )

    except Exception as e:
        print(f"[Verify] Error: {e}")
        return VerifyFaceResponse(
            verified=False,
            confidence=0,
            matched_photos=0,
            total_photos=0,
            details=[],
            error=str(e)
        )

    finally:
        # Nettoyer les fichiers temporaires
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass


@app.post("/compare-single")
async def compare_single(
    source_url: str,
    target_url: str,
    api_secret: str
):
    """Compare deux images directement (utile pour les tests)"""
    if api_secret != API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API secret")

    temp_files = []

    try:
        source_path = await download_image(source_url)
        temp_files.append(source_path)

        target_path = await download_image(target_url)
        temp_files.append(target_path)

        result = compare_faces(source_path, target_path)
        return result

    finally:
        for temp_file in temp_files:
            try:
                os.unlink(temp_file)
            except:
                pass


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
