# Dockerfile pour le serveur DeepFace
FROM python:3.11-slim

# Installer les dépendances système nécessaires pour OpenCV et DeepFace
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de travail
WORKDIR /app

# Copier les requirements et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pré-télécharger le modèle ArcFace pour éviter le téléchargement au premier appel
RUN python -c "from deepface import DeepFace; DeepFace.build_model('ArcFace')"

# Copier le code de l'application
COPY main.py .

# Exposer le port
EXPOSE 8000

# Variable d'environnement pour le secret API
ENV API_SECRET=shy-verification-secret-change-me
ENV PORT=8000

# Lancer le serveur
CMD ["python", "main.py"]
